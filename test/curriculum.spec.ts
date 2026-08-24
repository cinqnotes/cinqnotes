/**
 * Invariants du modèle de données pédagogique (CLAUDE.md §6),
 * plus la cohérence entre le curriculum et les exercices qu'il référence.
 */
import { describe, expect, it } from "vitest";
import { EXERCICES, exercice } from "~/content/curriculum/exercices";
import { JOURS_ORDONNES, PHASE_1, dureeDuJour } from "~/content/curriculum/phase1";
import { AMBIANCES, TONALITES_IMPRO, notesDAccord } from "~/content/curriculum/grilles";
import { PENTATONIQUE } from "~/content/curriculum/exercices";

describe("exercices", () => {
  it("les identifiants sont uniques", () => {
    const ids = EXERCICES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("la tonique par défaut fait partie des tonalités proposées", () => {
    for (const e of EXERCICES) {
      expect(e.keys, `« ${e.name} »`).toContain(e.root);
    }
  });

  it("un exercice déclare soit `hands`, soit `fing`, jamais les deux", () => {
    for (const e of EXERCICES) {
      expect(
        (e.hands === undefined) !== (e.fing === undefined),
        `« ${e.name} » doit déclarer exactement l'un des deux`,
      ).toBe(true);
    }
  });

  it("chaque exercice porte un conseil non vide", () => {
    for (const e of EXERCICES) expect(e.tip.length, `« ${e.name} »`).toBeGreaterThan(20);
  });
});

describe("phase 1", () => {
  it("couvre les sept jours de la semaine, une fois chacun", () => {
    const jours = PHASE_1.days.map((j) => j.weekday).sort();
    expect(jours).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(JOURS_ORDONNES.length).toBe(7);
  });

  it("tout `exerciseId` référencé existe", () => {
    for (const j of PHASE_1.days) {
      for (const b of j.blocks) {
        if (!b.exerciseId) continue;
        expect(exercice(b.exerciseId), `${j.label} — « ${b.title} »`).toBeDefined();
      }
    }
  });

  it("la durée annoncée d'un jour est la somme de ses blocs", () => {
    for (const j of PHASE_1.days) {
      const somme = j.blocks.reduce((s, b) => s + b.minutes, 0);
      expect(dureeDuJour(j.weekday), j.label).toBe(somme);
    }
  });

  it("les cinq séances de semaine sont des séances courtes", () => {
    // CLAUDE.md §7 annonce « cinq séances de 45 min ». Le contenu repris du
    // prototype en fait quatre à 45 et vendredi à 40 : on borne l'intention
    // (une séance courte, autour de 45 min) plutôt que d'ajouter du contenu
    // pédagogique pour faire tomber le compte rond.
    for (const weekday of [1, 2, 3, 4, 5]) {
      expect(dureeDuJour(weekday), `jour ${weekday}`).toBeGreaterThanOrEqual(40);
      expect(dureeDuJour(weekday), `jour ${weekday}`).toBeLessThanOrEqual(50);
    }
    expect(dureeDuJour(6), "samedi, séance longue").toBeGreaterThan(45);
    expect(dureeDuJour(0), "dimanche, jour léger").toBeLessThan(45);
  });

  it("le bloc « Impro » n'est jamais absent des séances de semaine", () => {
    // Règle explicite de CLAUDE.md §7 : il n'est optionnel à aucune phase.
    for (const weekday of [1, 2, 3, 4, 5]) {
      const j = PHASE_1.days.find((d) => d.weekday === weekday)!;
      expect(
        j.blocks.some((b) => b.tag === "Impro"),
        `${j.label} n'a pas de bloc Impro`,
      ).toBe(true);
    }
  });

  it("chaque bloc a un mode opératoire", () => {
    for (const j of PHASE_1.days) {
      for (const b of j.blocks) {
        expect(b.how.length, `${j.label} — « ${b.title} »`).toBeGreaterThan(0);
      }
    }
  });

  it("les critères de sortie de phase sont écrits", () => {
    expect(PHASE_1.exitCriteria.length).toBeGreaterThanOrEqual(2);
  });
});

describe("grilles d'impro", () => {
  it("chaque ambiance tient en quatre accords", () => {
    for (const a of AMBIANCES) expect(a.grille.length, a.nom).toBe(4);
  });

  it("les identifiants d'ambiance sont uniques", () => {
    const ids = AMBIANCES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("les notes d'accord restent dans une octave et demie", () => {
    // Au-delà, la main gauche ne peut plus tenir la grille sans sauter.
    for (const a of AMBIANCES) {
      for (const accord of a.grille) {
        for (const n of notesDAccord(accord)) {
          expect(n, `${a.nom} — ${accord.degre}`).toBeGreaterThanOrEqual(0);
          expect(n, `${a.nom} — ${accord.degre}`).toBeLessThanOrEqual(18);
        }
      }
    }
  });

  it("les tonalités du générateur sont celles dont le doigté de pentatonique est vérifié", () => {
    // On n'envoie personne improviser dans une tonalité dont on ne sait pas
    // lui montrer la main droite (I1).
    expect([...TONALITES_IMPRO].sort()).toEqual([...PENTATONIQUE.keys].sort());
  });

  it("chaque ambiance porte une contrainte créative", () => {
    for (const a of AMBIANCES) {
      expect(a.contrainte.length, a.nom).toBeGreaterThan(20);
      expect(a.tempo, a.nom).toBeGreaterThanOrEqual(50);
      expect(a.tempo, a.nom).toBeLessThanOrEqual(140);
    }
  });
});
