/**
 * Fichier unique et isolé pour tout ce qui concerne la détection des champs
 * dans l'interface web de Pennylane. Pennylane peut changer son HTML sans
 * préavis (aucune API publique n'est utilisée ici) — si le préremplissage
 * cesse de fonctionner, c'est ICI qu'il faut regarder et corriger, sans
 * toucher au reste de l'extension.
 *
 * Chaque champ dispose de PLUSIEURS stratégies de détection essayées dans
 * l'ordre : d'abord des sélecteurs CSS directs (rapides, précis si le HTML
 * n'a pas changé), puis une correspondance par texte de <label> (plus
 * robuste aux changements de structure), puis par placeholder. La première
 * stratégie qui trouve un élément visible et activable gagne.
 */

export type FieldKey =
  | "clientName"
  | "email"
  | "phone"
  | "description"
  | "lineDescription"
  | "vatRate";

export interface FieldConfig {
  /** Nom lisible utilisé dans les rapports affichés à l'admin. */
  displayName: string;
  /** Sélecteurs CSS directs à essayer, dans l'ordre. */
  cssSelectors: string[];
  /** Mots-clés (insensibles à la casse/accents) recherchés dans le texte des <label>. */
  labelKeywords: string[];
  /** Mots-clés recherchés dans les attributs placeholder/aria-label. */
  placeholderKeywords: string[];
  /** Type d'élément attendu — sert à ignorer les faux positifs (ex: un <select> trouvé pour un champ texte). */
  expectedTags: Array<"input" | "textarea" | "select">;
}

export const FIELD_CONFIGS: Record<FieldKey, FieldConfig> = {
  clientName: {
    displayName: "Nom du client",
    cssSelectors: [
      'input[name*="customer" i]',
      'input[id*="customer" i]',
      'input[name*="client" i]',
      'input[autocomplete="name"]',
    ],
    labelKeywords: ["client", "client ou cliente", "nom du client", "customer", "raison sociale"],
    placeholderKeywords: ["nom du client", "rechercher un client", "client", "choisir"],
    expectedTags: ["input"],
  },
  email: {
    displayName: "Email",
    cssSelectors: [
      'input[type="email"]',
      'input[name*="email" i]',
      'input[autocomplete="email"]',
    ],
    labelKeywords: ["email", "e-mail", "adresse email", "adresse e-mail"],
    placeholderKeywords: ["email", "e-mail"],
    expectedTags: ["input"],
  },
  phone: {
    displayName: "Téléphone",
    cssSelectors: [
      'input[type="tel"]',
      'input[name*="phone" i]',
      'input[name*="telephone" i]',
      'input[autocomplete="tel"]',
    ],
    labelKeywords: ["téléphone", "telephone", "tél", "phone"],
    placeholderKeywords: ["téléphone", "telephone"],
    expectedTags: ["input"],
  },
  description: {
    displayName: "Description du devis",
    cssSelectors: [
      'textarea[name*="description" i]',
      'textarea[name*="notes" i]',
      'textarea[id*="description" i]',
    ],
    labelKeywords: ["description", "ajouter une description", "notes", "commentaire", "détails", "objet du devis"],
    placeholderKeywords: ["description", "notes", "commentaire"],
    expectedTags: ["textarea", "input"],
  },
  lineDescription: {
    displayName: "Désignation de la ligne / produit",
    cssSelectors: [
      'input[name*="label" i]',
      'input[name*="designation" i]',
      'textarea[name*="label" i]',
    ],
    labelKeywords: ["désignation", "libellé", "produit", "produits", "article"],
    placeholderKeywords: ["désignation", "description de l'article", "produit ou service", "choisir"],
    expectedTags: ["input", "textarea"],
  },
  vatRate: {
    displayName: "Taux de TVA",
    cssSelectors: [
      'select[name*="vat" i]',
      'select[name*="tva" i]',
      'select[id*="vat" i]',
    ],
    labelKeywords: ["tva", "tva (%)", "taux de tva", "vat"],
    placeholderKeywords: ["tva", "vat"],
    expectedTags: ["select"],
  },
};

/** Valeur textuelle recherchée dans les <option> d'un <select> de TVA. */
export const VAT_OPTION_TEXT_CANDIDATES = ["20", "20 %", "20%", "TVA 20%", "FR 20%"];

/**
 * Champs correspondant probablement à des composants autocomplete/combobox
 * sur la vraie interface Pennylane (recherche client, sélection produit) —
 * même si on arrive à y taper un texte, on ne peut jamais garantir qu'une
 * vraie sélection a été faite dans la liste déroulante. Toujours signalés
 * comme "à sélectionner manuellement" dans le rapport, jamais présentés
 * comme un succès certain.
 */
export const AUTOCOMPLETE_FIELDS: ReadonlySet<FieldKey> = new Set(["clientName", "lineDescription"]);

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

function matchesExpectedTag(el: Element, config: FieldConfig): boolean {
  return config.expectedTags.includes(el.tagName.toLowerCase() as "input" | "textarea" | "select");
}

function findByCssSelectors(config: FieldConfig, root: ParentNode, excluded: ReadonlySet<Element>): HTMLElement | null {
  for (const selector of config.cssSelectors) {
    try {
      const matches = root.querySelectorAll(selector);
      for (const el of matches) {
        if (excluded.has(el)) continue;
        if (isVisible(el) && matchesExpectedTag(el, config) && !(el as HTMLInputElement).disabled) {
          return el as HTMLElement;
        }
      }
    } catch {
      // Sélecteur invalide dans ce contexte — on continue avec le suivant, jamais de crash.
    }
  }
  return null;
}

function resolveLabelledControl(label: HTMLLabelElement): HTMLElement | null {
  const forId = label.getAttribute("for");
  if (forId) {
    const byId = document.getElementById(forId);
    if (byId) return byId;
  }
  // Pas d'attribut "for" : cherche un champ dans le label lui-même ou juste après.
  const nested = label.querySelector("input, textarea, select");
  if (nested) return nested as HTMLElement;
  const next = label.nextElementSibling;
  if (next && ["INPUT", "TEXTAREA", "SELECT"].includes(next.tagName)) return next as HTMLElement;
  const parent = label.closest("div, fieldset, li");
  if (parent) {
    const inParent = parent.querySelector("input, textarea, select");
    if (inParent) return inParent as HTMLElement;
  }
  return null;
}

function findByLabelText(config: FieldConfig, root: ParentNode, excluded: ReadonlySet<Element>): HTMLElement | null {
  const labels = root.querySelectorAll("label");
  for (const label of labels) {
    const text = normalize(label.textContent || "");
    const match = config.labelKeywords.some((kw) => text.includes(normalize(kw)));
    if (!match) continue;
    const control = resolveLabelledControl(label);
    if (control && !excluded.has(control) && isVisible(control) && matchesExpectedTag(control, config)) {
      return control;
    }
  }
  return null;
}

function findByPlaceholder(config: FieldConfig, root: ParentNode, excluded: ReadonlySet<Element>): HTMLElement | null {
  const candidates = root.querySelectorAll("input, textarea");
  for (const el of candidates) {
    if (excluded.has(el)) continue;
    const attrs = [el.getAttribute("placeholder"), el.getAttribute("aria-label")].filter(Boolean) as string[];
    const normalized = attrs.map(normalize);
    const match = config.placeholderKeywords.some((kw) => normalized.some((a) => a.includes(normalize(kw))));
    if (match && isVisible(el) && matchesExpectedTag(el, config)) {
      return el as HTMLElement;
    }
  }
  return null;
}

/**
 * Cherche un bouton/lien de type "+ Ajouter une description" (disclosure
 * toggle) — courant sur Pennylane pour révéler un champ optionnel masqué.
 * Se limite volontairement aux éléments dont le texte commence par "+" pour
 * ne jamais risquer de matcher un bouton de validation/envoi.
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
  strategyUsed: "css" | "label" | "placeholder" | null;
}

/**
 * Essaie les trois stratégies dans l'ordre — retourne aussi la stratégie qui
 * a fonctionné (utile en mode debug). `excluded` permet d'ignorer des
 * éléments déjà assignés à un autre champ dans le même passage (ex: deux
 * champs Pennylane différents partageant le même placeholder "Choisir…").
 */
export function resolveField(key: FieldKey, root: ParentNode = document, excluded: ReadonlySet<Element> = new Set()): FieldResolution {
  const config = FIELD_CONFIGS[key];
  const byCss = findByCssSelectors(config, root, excluded);
  if (byCss) return { key, element: byCss, strategyUsed: "css" };
  const byLabel = findByLabelText(config, root, excluded);
  if (byLabel) return { key, element: byLabel, strategyUsed: "label" };
  const byPlaceholder = findByPlaceholder(config, root, excluded);
  if (byPlaceholder) return { key, element: byPlaceholder, strategyUsed: "placeholder" };
  return { key, element: null, strategyUsed: null };
}

/**
 * Écrit une valeur dans un champ contrôlé par un framework (React/Vue) :
 * assigner `.value` directement ne suffit généralement pas, ces frameworks
 * ignorent la mutation DOM si l'événement "input" natif n'est pas simulé
 * via le setter natif du prototype (sinon React notamment ne détecte rien).
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

/** Sélectionne une option de <select> par correspondance textuelle (pas par value, inconnue côté Pennylane). */
export function selectOptionByText(el: HTMLElement, textCandidates: string[]): boolean {
  if (!(el instanceof HTMLSelectElement)) return false;
  for (const candidate of textCandidates) {
    for (const option of Array.from(el.options)) {
      if (normalize(option.textContent || "").includes(normalize(candidate))) {
        el.value = option.value;
        el.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      }
    }
  }
  return false;
}
