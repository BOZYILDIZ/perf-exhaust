"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing, CheckCircle, XCircle, AlertCircle, Loader2, Info } from "lucide-react";

type SupportState = "checking" | "unsupported" | "ios-non-standalone" | "supported";
type SubscriptionState = "unknown" | "subscribed" | "unsubscribed";

function isIosDevice(): boolean {
  const ua = navigator.userAgent;
  const isIPhoneOrIPad = /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
  return isIPhoneOrIPad && !(window as unknown as { MSStream?: unknown }).MSStream;
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

function deviceLabelGuess(): string {
  const ua = navigator.userAgent;
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Navigateur";
  const platform = /iPhone/.test(ua) ? "iPhone" : /iPad/.test(ua) ? "iPad" : /Android/.test(ua) ? "Android" : /Macintosh/.test(ua) ? "Mac" : /Windows/.test(ua) ? "PC" : "appareil";
  return `${browser} sur ${platform}`;
}

/**
 * Section « Notifications » de /admin/settings — volontairement un
 * composant à part, jamais imbriqué dans le <form> de SettingsForm : l'état
 * (permission, abonnement) est propre à CET appareil/navigateur, pas une
 * valeur globale du site qu'on enregistrerait via PUT /api/admin/settings.
 */
export default function PushNotificationSettings() {
  const [support, setSupport] = useState<SupportState>("checking");
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionState>("unknown");
  const [vapidPublicKey, setVapidPublicKey] = useState<string | null>(null);
  const [pushConfiguredServerSide, setPushConfiguredServerSide] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      if (!supported) {
        if (!cancelled) setSupport("unsupported");
        return;
      }
      if (isIosDevice() && !isStandalone()) {
        if (!cancelled) setSupport("ios-non-standalone");
        return;
      }
      if (cancelled) return;
      setSupport("supported");
      setPermission(Notification.permission);

      try {
        const statusRes = await fetch("/api/admin/push/status");
        const statusData = await statusRes.json();
        if (cancelled) return;
        setPushConfiguredServerSide(Boolean(statusData.configured));
        setVapidPublicKey(statusData.vapidPublicKey ?? null);
      } catch {
        // best-effort — l'état "supported" reste correct, seul le bouton Activer sera indisponible.
      }

      try {
        const registration = await navigator.serviceWorker.ready;
        const existing = await registration.pushManager.getSubscription();
        if (cancelled) return;
        if (!existing) {
          setSubscription("unsubscribed");
          return;
        }
        // Vérifie que le serveur a toujours cette ligne (un nettoyage 404/410
        // peut l'avoir supprimée sans que ce navigateur le sache encore).
        const check = await fetch(`/api/admin/push/status?endpoint=${encodeURIComponent(existing.endpoint)}`);
        const checkData = await check.json();
        if (cancelled) return;
        setSubscription(checkData.thisDeviceSubscribed ? "subscribed" : "unsubscribed");
      } catch {
        if (!cancelled) setSubscription("unknown");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const activate = async () => {
    setBusy(true);
    setMsg(null);
    try {
      if (!("serviceWorker" in navigator)) throw new Error("Service worker non disponible sur ce navigateur.");
      const registration = await navigator.serviceWorker.ready;

      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);
      if (permissionResult !== "granted") {
        setMsg({ type: "err", text: permissionResult === "denied" ? "Notifications refusées." : "Notifications non activées." });
        return;
      }

      if (!vapidPublicKey) throw new Error("Clé VAPID publique indisponible — vérifiez la configuration serveur.");

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      const json = sub.toJSON();

      const res = await fetch("/api/admin/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
          userAgent: navigator.userAgent.slice(0, 300),
          deviceLabel: deviceLabelGuess(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Enregistrement de l'abonnement impossible.");

      setSubscription("subscribed");
      setMsg({ type: "ok", text: "Notifications activées sur cet appareil." });
    } catch (err) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "Erreur lors de l'activation." });
    } finally {
      setBusy(false);
    }
  };

  const deactivate = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        const endpoint = existing.endpoint;
        await existing.unsubscribe().catch(() => {});
        await fetch("/api/admin/push/unsubscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
        }).catch(() => {});
      }
      setSubscription("unsubscribed");
      setMsg({ type: "ok", text: "Notifications désactivées sur cet appareil." });
    } catch (err) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "Erreur lors de la désactivation." });
    } finally {
      setBusy(false);
    }
  };

  if (support === "checking") {
    return <p className="text-gray-600 text-sm flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Vérification du support des notifications…</p>;
  }

  if (support === "unsupported") {
    return (
      <p className="text-gray-400 text-sm p-4 border border-gray-800 bg-white/[0.02] max-w-2xl flex items-start gap-2.5">
        <BellOff size={16} className="text-gray-600 mt-0.5 flex-shrink-0" />
        Les notifications push ne sont pas prises en charge par ce navigateur.
      </p>
    );
  }

  if (support === "ios-non-standalone") {
    return (
      <p className="text-gray-300 text-sm p-4 border border-brand-500/25 bg-brand-500/5 max-w-2xl flex items-start gap-2.5">
        <Info size={16} className="text-brand-400 mt-0.5 flex-shrink-0" />
        Pour recevoir les notifications sur iPhone, ajoutez PERF&apos;EXHAUST Admin à l&apos;écran d&apos;accueil (Partager → Sur l&apos;écran d&apos;accueil) puis ouvrez l&apos;application installée depuis cette icône.
      </p>
    );
  }

  const statusLabel =
    permission === "denied" ? "Refusées" : permission === "granted" && subscription === "subscribed" ? "Autorisées" : "Non configurées";
  const StatusIcon = permission === "denied" ? XCircle : permission === "granted" && subscription === "subscribed" ? CheckCircle : AlertCircle;
  const statusColor = permission === "denied" ? "text-red-400" : permission === "granted" && subscription === "subscribed" ? "text-green-400" : "text-gray-500";

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center gap-2.5">
        <StatusIcon size={16} className={`${statusColor} flex-shrink-0`} />
        <span className={`text-sm font-bold ${statusColor}`}>{statusLabel}</span>
      </div>

      {!pushConfiguredServerSide && (
        <p className="text-gray-400 text-xs p-3 border border-gray-800 bg-white/[0.02] flex items-start gap-2">
          <Info size={13} className="text-gray-600 mt-0.5 flex-shrink-0" />
          Clés VAPID non configurées côté serveur — l&apos;activation restera indisponible tant que
          PUSH_VAPID_PUBLIC_KEY/PRIVATE_KEY/SUBJECT ne sont pas définies.
        </p>
      )}

      {permission === "denied" && (
        <p className="text-red-400 text-sm p-3 border border-red-500/25 bg-red-500/5 flex items-start gap-2">
          <XCircle size={14} className="mt-0.5 flex-shrink-0" />
          Les notifications sont bloquées dans les réglages du navigateur pour ce site — modifiez ce
          réglage directement dans le navigateur (icône de cadenas dans la barre d&apos;adresse) pour les réautoriser.
        </p>
      )}

      {subscription === "subscribed" && permission === "granted" && (
        <p className="text-gray-500 text-xs flex items-center gap-1.5">
          <BellRing size={13} className="text-brand-400" /> Cet appareil reçoit les nouvelles demandes de devis.
        </p>
      )}

      {msg && (
        <p
          role="status"
          className={`text-sm px-4 py-2.5 border flex items-center gap-2 ${
            msg.type === "ok" ? "text-green-400 border-green-500/25 bg-green-500/5" : "text-red-400 border-red-500/25 bg-red-500/5"
          }`}
        >
          {msg.type === "ok" ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {msg.text}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        {subscription === "subscribed" ? (
          <button
            type="button"
            onClick={deactivate}
            disabled={busy}
            className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] text-xs font-bold tracking-widest uppercase text-gray-300 border border-gray-700 hover:border-gray-500 disabled:opacity-40 transition-colors"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <BellOff size={14} />} Désactiver les notifications
          </button>
        ) : (
          <button
            type="button"
            onClick={activate}
            disabled={busy || permission === "denied" || !pushConfiguredServerSide}
            className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] text-xs font-bold tracking-widest uppercase text-white disabled:opacity-40 transition-colors"
            style={{ background: "linear-gradient(135deg, #1266ea, #0d54c8)" }}
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Bell size={14} />} Activer les notifications
          </button>
        )}
      </div>
    </div>
  );
}
