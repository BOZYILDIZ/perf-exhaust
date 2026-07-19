/**
 * Options normalisées ("oui" | "non" | "je_ne_sais_pas") du champ diffuseur
 * arrière — partagées entre le formulaire public, les emails, le CRM admin
 * et les données préparées pour l'extension Pennylane, pour n'avoir qu'un
 * seul endroit à mettre à jour si le libellé affiché doit changer.
 */
export const REAR_DIFFUSER_VALUES = ["oui", "non", "je_ne_sais_pas"] as const;
export type RearDiffuserValue = (typeof REAR_DIFFUSER_VALUES)[number];

export const REAR_DIFFUSER_OPTIONS: { value: RearDiffuserValue; label: string }[] = [
  { value: "oui", label: "Oui" },
  { value: "non", label: "Non" },
  { value: "je_ne_sais_pas", label: "Je ne sais pas" },
];

export function rearDiffuserLabel(value: string): string {
  return REAR_DIFFUSER_OPTIONS.find((o) => o.value === value)?.label ?? value;
}
