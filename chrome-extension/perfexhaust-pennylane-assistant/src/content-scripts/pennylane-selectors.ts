/**
 * Fichier unique et isolé pour tout ce qui concerne la détection des champs
 * dans l'interface web de Pennylane. Pennylane peut changer son HTML sans
 * préavis (aucune API publique n'est utilisée ici) — si le préremplissage
 * cesse de fonctionner, c'est ICI qu'il faut regarder et corriger, sans
 * toucher au reste de l'extension.
 *
 * ── Diagnostic réel (audit DevTools sur https://app.pennylane.com, compte
 * NETZ INFORMATIQUE, formulaire "Créer un devis") — ce qui a été trouvé :
 *
 * 1. Pennylane n'utilise JAMAIS de <label> sémantique pour les champs du
 *    formulaire principal (Client, Produits, TVA...). Il n'y a que 5 <label>
 *    sur toute la page, tous dans le panneau latéral "Paramètres" (Pied de
 *    page, Délai de paiement, Établissement, IBAN, BIC). La stratégie
 *    "recherche par <label>" de l'ancienne version ne pouvait donc JAMAIS
 *    trouver clientName / description / lineDescription / vatRate.
 * 2. Il n'y a AUCUN <select> natif sur toute la page (0 résultat pour
 *    `document.querySelectorAll('select')`). "Client ou cliente", "Type de
 *    vente", "unité", "TVA (%)" sont tous des combobox react-select
 *    (classNamePrefix observé : "new-select", ex. `.new-select__control`,
 *    `.new-select__menu`, `.new-select__option`, plus des classes Emotion
 *    `css-xxxxxx`). La vraie valeur est stockée dans un <input type="hidden">
 *    séparé, nommé comme l'attribut backend Rails (ex. `invoice.thirdparty`,
 *    `invoice.invoice_line_sections.0.invoice_lines.0.vat_rate`). L'ancien
 *    sélecteur `select[name*="vat"]` ne pouvait donc jamais matcher quoi que
 *    ce soit : la stratégie entière pour vatRate était basée sur un élément
 *    qui n'existe pas dans cette UI.
 * 3. L'input visible du combobox "Client ou cliente" n'a ni `name`, ni
 *    `id` stable (id généré par React, ex. `_r_55_`), ni `placeholder`
 *    (react-select affiche son placeholder via un <div> séparé, jamais sur
 *    l'attribut HTML `placeholder` du vrai <input>), et `autocomplete="off"`
 *    (jamais "name"). Les 4 `cssSelectors` de clientName ne pouvaient donc
 *    jamais matcher non plus.
 * 4. "+ Ajouter une description" révèle un éditeur de texte riche Slate.js
 *    (`<div contenteditable="true" data-slate-editor="true"
 *    class="ui-text-editor-editable" role="textbox">`), jamais un
 *    <textarea>. `fillTextField()` ne gère que HTMLInputElement /
 *    HTMLTextAreaElement : même quand ce <div> était trouvé, le
 *    remplissage échouait silencieusement.
 * 5. Il n'existe PAS de champ "désignation de ligne" séparé du sélecteur de
 *    produit sur une ligne de devis (vérifié en sélectionnant un vrai
 *    produit du catalogue : seuls Qté / Prix u. HT / Rem. / TVA se
 *    remplissent automatiquement depuis la fiche produit, aucun champ texte
 *    additionnel n'apparaît). Le concept "lineDescription = un <input>
 *    séparé" ne correspond à rien de réel : le seul champ pertinent est le
 *    combobox "Produits" lui-même.
 * 6. "Email" et "Téléphone" n'existent NULLE PART sur le formulaire de devis
 *    (0 `input[type=email]`, 0 `input[type=tel]`, et aucune occurrence des
 *    mots "email"/"téléphone" dans tout le texte visible de la page). Ces
 *    informations appartiennent à la fiche client (créée/éditée ailleurs
 *    dans Pennylane), pas au devis. ⇒ Automatisation impossible sur cette
 *    page, quel que soit le sélecteur utilisé.
 * 7. Confirmé via test réel (dispatch d'événements + vérification de l'état
 *    React après coup) :
 *    - Taper dans l'<input> d'un combobox react-select : un simple
 *      `nativeSetter + dispatchEvent("input", {bubbles:true})` suffit à
 *      déclencher la recherche/filtrage (React écoute du root, delegation
 *      standard). Mais AUCUNE sélection n'est faite tant qu'on n'a pas
 *      cliqué une option — donc jamais de garantie de bonne sélection pour
 *      Client/Produit (recherche asynchrone : "Chargement en cours...").
 *    - Ouvrir le menu d'un react-select : `mousedown` (+ `mouseup`) sur
 *      `.new-select__control` suffit.
 *    - Sélectionner une option react-select : un `mousedown`+`mouseup` seul
 *      sur `.new-select__option` NE FAIT RIEN (testé, la valeur ne change
 *      pas). Il faut un vrai événement `click` (bubbles:true) sur l'option —
 *      confirmé en observant le <input type="hidden"> passer de "FR_200" à
 *      "FR_100" après un clic synthétique sur l'option "10%".
 *    - `document.execCommand("insertText", false, texte)` après `.focus()`
 *      insère bien le texte dans l'éditeur Slate.js de la description
 *      (confirmé visuellement + `textContent` de l'éditeur).
 *    - Aucun Shadow DOM n'a été détecté nulle part sur la page.
 */

export type FieldKey = "clientName" | "email" | "phone" | "description" | "lineDescription" | "vatRate";

/**
 * - "async-combobox" : react-select avec recherche distante (Client,
 *   Produit). On tape le texte de recherche (aide utile pour l'admin) mais
 *   on ne sélectionne JAMAIS d'option automatiquement : on ne peut pas
 *   garantir que la bonne entrée existe/est la première, et une mauvaise
 *   sélection sur un devis (mauvais client, ou pire "Créer XXX" qui crée un
 *   nouveau produit permanent dans le catalogue) serait pire qu'un champ
 *   laissé vide. Toujours rapporté comme "à sélectionner manuellement".
 * - "richtext" : éditeur Slate.js contenteditable (description). Remplissage
 *   réel possible et fiable via execCommand.
 * - "select-click" : react-select à liste fermée et connue à l'avance (TVA).
 *   Remplissage réel possible et fiable via clic synthétique sur l'option.
 * - "missing-on-page" : le champ n'existe simplement pas sur le formulaire
 *   de devis Pennylane (Email, Téléphone) — appartient à la fiche client.
 */
export type FieldKind = "async-combobox" | "richtext" | "select-click" | "missing-on-page";

export interface FieldConfig {
  displayName: string;
  kind: FieldKind;
  /**
   * Nom exact (ou motif) de l'<input type="hidden"> Rails associé au champ —
   * stratégie principale, la plus robuste car basée sur le contrat de
   * données backend plutôt que sur des classes CSS générées (susceptibles de
   * changer à chaque build de Pennylane).
   */
  backendFieldName?: string;
  backendFieldNamePattern?: RegExp;
  /** Pour "select-click" : textes d'options acceptés, dans l'ordre de préférence. */
  optionTextCandidates?: string[];
  /** Pour "richtext" : mots-clés du bouton disclosure à ouvrir avant résolution. */
  toggleKeywords?: string[];
  /** Repli si la résolution par nom de champ backend échoue (Pennylane a changé son HTML). */
  fallbackLabelKeywords?: string[];
  /** Pour "missing-on-page" : explication affichée à l'admin, jamais un simple "non trouvé" muet. */
  missingReason?: string;
}

// ⚠️ L'ORDRE des clés compte : `fillQuote()` itère `Object.keys(FIELD_CONFIGS)`
// dans cet ordre exact. "description" est délibérément placé EN DERNIER.
// Constaté en réel : taper dans les combobox Client/Produit puis cliquer une
// option de TVA déclenche des re-renders globaux du formulaire (react-hook-
// form gère tout le devis dans un seul contexte). Si la description Slate.js
// est remplie AVANT ces interactions, un re-render ultérieur la remet à vide
// (le texte n'a été écrit que dans le DOM, jamais dans le modèle interne de
// Slate — voir le commentaire de `fillRichTextField`) : testé, reproduit,
// corrigé en traitant "description" en tout dernier, une fois qu'aucune
// autre interaction ne viendra plus déclencher de re-render après elle.
export const FIELD_CONFIGS: Record<FieldKey, FieldConfig> = {
  clientName: {
    displayName: "Nom du client",
    kind: "async-combobox",
    backendFieldName: "invoice.thirdparty",
    fallbackLabelKeywords: ["client", "client ou cliente", "nom du client", "customer", "raison sociale"],
  },
  email: {
    displayName: "Email",
    kind: "missing-on-page",
    missingReason:
      "Ce champ n'existe pas sur le formulaire de devis Pennylane (0 input email trouvé, aucune occurrence du mot \"email\" sur la page) — il appartient à la fiche client, à renseigner dans Pennylane > Clients.",
  },
  phone: {
    displayName: "Téléphone",
    kind: "missing-on-page",
    missingReason:
      "Ce champ n'existe pas sur le formulaire de devis Pennylane (0 input tel trouvé, aucune occurrence du mot \"téléphone\" sur la page) — il appartient à la fiche client, à renseigner dans Pennylane > Clients.",
  },
  lineDescription: {
    displayName: "Produit / désignation de la ligne",
    kind: "async-combobox",
    backendFieldNamePattern: /^invoice\.invoice_line_sections\.\d+\.invoice_lines\.\d+\.product$/,
    fallbackLabelKeywords: ["désignation", "libellé", "produit", "produits", "article"],
  },
  vatRate: {
    displayName: "Taux de TVA",
    kind: "select-click",
    backendFieldNamePattern: /^invoice\.invoice_line_sections\.\d+\.invoice_lines\.\d+\.vat_rate$/,
    optionTextCandidates: ["20%", "20 %", "FR 20%"],
  },
  description: {
    displayName: "Description du devis",
    kind: "richtext",
    toggleKeywords: ["ajouter une description"],
  },
};

/** Valeur textuelle recherchée parmi les options du combobox de TVA. */
export const VAT_OPTION_TEXT_CANDIDATES = FIELD_CONFIGS.vatRate.optionTextCandidates as string[];

/**
 * Champs correspondant à des combobox react-select asynchrones (recherche
 * client, sélection produit) — même si on arrive à y taper un texte, on ne
 * peut jamais garantir qu'une vraie sélection a été faite dans la liste
 * déroulante. Toujours signalés comme "à sélectionner manuellement" dans le
 * rapport, jamais présentés comme un succès certain.
 */
export const AUTOCOMPLETE_FIELDS: ReadonlySet<FieldKey> = new Set(
  (Object.keys(FIELD_CONFIGS) as FieldKey[]).filter((k) => FIELD_CONFIGS[k].kind === "async-combobox"),
);

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, ""); // retire les accents
}

function isVisible(el: Element): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const style = window.getComputedStyle(el);
  return style.display !== "none" && style.visibility !== "hidden" && el.offsetParent !== null;
}

/**
 * Cherche l'<input type="hidden"> Rails d'un champ, puis remonte dans les
 * ancêtres (du plus proche au plus large) pour trouver le premier élément
 * visible correspondant au sélecteur `controlSelector` — c'est le contrôle
 * react-select réellement visible/cliquable associé à ce champ. On s'arrête
 * à l'ancêtre le plus proche qui matche, pour ne jamais remonter jusqu'à un
 * conteneur si large qu'il contiendrait le contrôle d'un AUTRE champ.
 */
function findControlNearHiddenField(
  hiddenName: string | RegExp,
  controlSelector: string,
  root: ParentNode,
  excluded: ReadonlySet<Element>,
): HTMLElement | null {
  const hiddenInputs =
    typeof hiddenName === "string"
      ? root.querySelectorAll(`input[type="hidden"][name="${hiddenName}"]`)
      : Array.from(root.querySelectorAll('input[type="hidden"]')).filter((el) =>
          hiddenName.test(el.getAttribute("name") || ""),
        );

  for (const hidden of Array.from(hiddenInputs)) {
    let node: Element | null = hidden.parentElement;
    for (let depth = 0; depth < 10 && node; depth++) {
      const candidates = node.querySelectorAll(controlSelector);
      for (const candidate of Array.from(candidates)) {
        if (excluded.has(candidate)) continue;
        if (isVisible(candidate)) return candidate as HTMLElement;
      }
      node = node.parentElement;
    }
  }
  return null;
}

/**
 * Repli si le nom de champ backend n'a pas permis de trouver le contrôle
 * (Pennylane a changé son HTML) : recherche par proximité de texte, SANS se
 * limiter aux <label> — Pennylane n'utilise pas de <label> sémantique pour
 * ses champs principaux (confirmé : 5 <label> sur toute la page, tous hors
 * du formulaire principal), contrairement à ce que supposait l'ancienne
 * version de ce fichier.
 */
function findByNearbyText(keywords: string[], root: ParentNode, excluded: ReadonlySet<Element>): HTMLElement | null {
  const walker = document.createTreeWalker(root as Node, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const text = normalize((node.textContent || "").trim());
    if (!text) continue;
    const match = keywords.some((kw) => text === normalize(kw) || text.includes(normalize(kw)));
    if (!match) continue;
    let container: Element | null = node.parentElement;
    for (let depth = 0; depth < 5 && container; depth++) {
      const control = container.querySelector('input, textarea, [role="combobox"], [contenteditable="true"]');
      if (control && !excluded.has(control) && isVisible(control)) return control as HTMLElement;
      container = container.parentElement;
    }
  }
  return null;
}

/**
 * Cherche un bouton/lien de type "+ Ajouter une description" (disclosure
 * toggle) — courant sur Pennylane pour révéler un champ optionnel masqué.
 * Se limite volontairement aux éléments dont le texte commence par "+" pour
 * ne jamais risquer de matcher un bouton de validation/envoi. Sur la vraie
 * page, ce texte est porté par un <span> imbriqué dans un <button>/<a> — on
 * cherche donc l'ANCÊTRE cliquable, pas l'élément qui porte le texte.
 */
export function findExpandToggle(keywords: string[], root: ParentNode = document): HTMLElement | null {
  const candidates = root.querySelectorAll("button, a, [role='button']");
  for (const el of candidates) {
    const text = normalize(el.textContent || "").trim();
    if (!text.startsWith("+")) continue;
    const match = keywords.some((kw) => text.includes(normalize(kw)));
    if (match && isVisible(el)) return el as HTMLElement;
  }
  return null;
}

export interface FieldResolution {
  key: FieldKey;
  element: HTMLElement | null;
  strategyUsed: "backend-field-name" | "nearby-text" | null;
}

/**
 * Résout l'élément DOM réel pour un champ, en essayant d'abord la stratégie
 * robuste par nom de champ backend Rails, puis un repli par proximité de
 * texte si Pennylane a changé son HTML. `controlSelector` dépend du type de
 * champ (voir resolveField ci-dessous).
 */
function resolveByStrategies(
  config: FieldConfig,
  controlSelector: string,
  root: ParentNode,
  excluded: ReadonlySet<Element>,
): { element: HTMLElement | null; strategyUsed: FieldResolution["strategyUsed"] } {
  const byBackendName = config.backendFieldName
    ? findControlNearHiddenField(config.backendFieldName, controlSelector, root, excluded)
    : config.backendFieldNamePattern
      ? findControlNearHiddenField(config.backendFieldNamePattern, controlSelector, root, excluded)
      : null;
  if (byBackendName) return { element: byBackendName, strategyUsed: "backend-field-name" };

  if (config.fallbackLabelKeywords) {
    const byText = findByNearbyText(config.fallbackLabelKeywords, root, excluded);
    if (byText) return { element: byText, strategyUsed: "nearby-text" };
  }
  return { element: null, strategyUsed: null };
}

export function resolveField(key: FieldKey, root: ParentNode = document, excluded: ReadonlySet<Element> = new Set()): FieldResolution {
  const config = FIELD_CONFIGS[key];

  if (config.kind === "missing-on-page") {
    return { key, element: null, strategyUsed: null };
  }

  if (config.kind === "async-combobox") {
    const { element, strategyUsed } = resolveByStrategies(config, 'input[role="combobox"]', root, excluded);
    return { key, element, strategyUsed };
  }

  if (config.kind === "select-click") {
    // Le contrôle visible d'un react-select fermé est le conteneur
    // ".new-select__control" (jamais un <select> : il n'y en a aucun sur la
    // page), pas l'<input> — c'est lui qu'il faut cliquer pour ouvrir le menu.
    const { element, strategyUsed } = resolveByStrategies(config, '[class*="new-select__control"]', root, excluded);
    return { key, element, strategyUsed };
  }

  // "richtext" (description) : résolu séparément par resolveDescriptionEditor,
  // car il ne dépend pas d'un input hidden mais de la visibilité post-toggle.
  return { key, element: null, strategyUsed: null };
}

/**
 * Résolution spécifique à la description : après avoir cliqué le bouton
 * disclosure "+ Ajouter une description", cherche l'éditeur Slate.js
 * (`.ui-text-editor-editable[data-slate-editor]`) qui vient de devenir
 * visible. Pennylane a un second éditeur Slate identique pour "+ Ajouter un
 * champ libre" : on ignore volontairement tout éditeur déjà visible AVANT le
 * clic, pour ne jamais remplir le mauvais champ riche texte.
 */
export function resolveDescriptionEditor(previouslyVisible: ReadonlySet<Element>): HTMLElement | null {
  const editors = Array.from(document.querySelectorAll('.ui-text-editor-editable[data-slate-editor], [data-slate-editor="true"]'));
  for (const el of editors) {
    if (previouslyVisible.has(el)) continue;
    if (isVisible(el)) return el as HTMLElement;
  }
  return null;
}

export function captureVisibleSlateEditors(): ReadonlySet<Element> {
  const editors = Array.from(document.querySelectorAll('.ui-text-editor-editable[data-slate-editor], [data-slate-editor="true"]'));
  return new Set(editors.filter((el) => isVisible(el)));
}

/**
 * Écrit une valeur dans un <input>/<textarea> contrôlé par React : assigner
 * `.value` directement ne suffit pas, React ignore la mutation DOM si
 * l'événement "input" natif n'est pas simulé via le setter natif du
 * prototype. Utilisé pour taper le texte de recherche dans les combobox
 * react-select (Client, Produit) — ne sélectionne jamais d'option, tape
 * seulement le texte de recherche.
 */
export function fillTextField(el: HTMLElement, value: string): boolean {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const nativeSetter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    if (nativeSetter) {
      nativeSetter.call(el, value);
    } else {
      el.value = value;
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }
  return false;
}

/**
 * Remplit l'éditeur riche texte Slate.js de la description. Testé et
 * confirmé sur la vraie interface : `focus()` puis
 * `document.execCommand("insertText", ...)` insère réellement le texte dans
 * le modèle Slate (contrairement à une manipulation directe de
 * `textContent`/`innerHTML`, que Slate ignorerait ou romprait).
 */
export function fillRichTextField(el: HTMLElement, value: string): boolean {
  if (!(el instanceof HTMLElement) || !el.isContentEditable) return false;
  // Volontairement minimal : `focus()` puis `execCommand("insertText", ...)`,
  // rien d'autre. Une version antérieure manipulait manuellement
  // `window.getSelection()`/`Range` avant d'insérer (pour, en théorie, gérer
  // le cas d'un champ non vide) — testé en réel sur Pennylane, cette
  // manipulation manuelle de la sélection désynchronise le modèle interne de
  // l'éditeur Slate.js : le texte semble s'insérer dans le DOM un instant,
  // puis Slate re-render et REMET le champ à vide (le modèle Slate n'a jamais
  // été mis à jour, seul le DOM l'avait été manuellement). La version testée
  // et confirmée fonctionner durablement est celle-ci, sans aucune
  // manipulation de sélection : le champ est de toute façon toujours vide à
  // ce stade (on vient de le révéler via le disclosure toggle).
  el.focus();
  try {
    return document.execCommand("insertText", false, value);
  } catch {
    return false;
  }
}

function fireMouseEvent(el: Element, type: string): void {
  el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
}

/**
 * Ouvre un combobox react-select fermé (clic sur son `.new-select__control`)
 * puis clique l'option dont le texte correspond à l'un des
 * `textCandidates`. Testé et confirmé sur le vrai sélecteur de TVA : un
 * simple `dispatchEvent(new MouseEvent("click", {bubbles:true}))` sur
 * l'option suffit (un `mousedown`/`mouseup` seul ne suffit PAS — react-select
 * n'a réagi qu'à un événement "click" réel lors du test).
 */
export async function selectReactSelectOptionByText(controlEl: HTMLElement, textCandidates: string[]): Promise<boolean> {
  fireMouseEvent(controlEl, "mousedown");
  fireMouseEvent(controlEl, "mouseup");

  const options = await waitForOptions();
  if (!options.length) return false;

  for (const candidate of textCandidates) {
    const target = options.find((o) => normalize(o.textContent || "").trim() === normalize(candidate));
    if (target) {
      fireMouseEvent(target, "click");
      return true;
    }
  }
  // Repli : correspondance partielle si aucune correspondance exacte.
  for (const candidate of textCandidates) {
    const target = options.find((o) => normalize(o.textContent || "").includes(normalize(candidate)));
    if (target) {
      fireMouseEvent(target, "click");
      return true;
    }
  }
  return false;
}

function waitForOptions(): Promise<HTMLElement[]> {
  return new Promise((resolve) => {
    const deadline = Date.now() + 800;
    function poll(): void {
      const options = Array.from(document.querySelectorAll<HTMLElement>('[class*="new-select__option"]'));
      if (options.length > 0 || Date.now() > deadline) {
        resolve(options);
        return;
      }
      setTimeout(poll, 40);
    }
    poll();
  });
}
