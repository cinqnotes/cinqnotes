/**
 * I1 — Aucun doigté de gamme transposé mécaniquement.
 *
 * Test BLOQUANT en CI, il ne se contourne jamais (CLAUDE.md §11).
 * Motif : un mauvais doigté installé pendant six mois est un dommage réel pour
 * l'utilisateur. Transposer un doigté de gamme par décalage de demi-tons produit
 * un doigté faux — Fa et Si♭ majeur ont chacun le leur.
 */
import { describe, expect, it } from "vitest";
import { EXERCICES } from "~/content/curriculum/exercices";
import type { Exercise, Hand, PitchClass } from "~/content/curriculum/types";
import { baseDuClavier } from "~/lib/clavier";
import { estNoire, pasDExercice } from "~/lib/musique";

const MAINS: Hand[] = ["MD", "MG"];

/** Les exercices dont le doigté dépend de la tonalité : gammes et pentatoniques. */
const aTableDeDoigtes = (e: Exercise) => e.fing !== undefined;

/**
 * Un exercice est « conjoint » quand il se joue par degrés voisins : c'est là que
 * le pouce doit passer sous la main, donc là que le doigté dépend de la tonalité.
 * Un arpège, qui procède par sauts, n'est pas concerné.
 */
function estConjoint(exercice: Exercise): boolean {
  for (const main of MAINS) {
    const pas = pasDExercice(exercice, main, exercice.root);
    if (!pas || pas.length < 6) continue;
    if (!pas.every((p) => p.n.length === 1)) continue;
    const ecarts: number[] = [];
    for (let i = 1; i < pas.length; i++) {
      ecarts.push(Math.abs(pas[i]!.n[0]! - pas[i - 1]!.n[0]!));
    }
    if (ecarts.every((e) => e <= 3)) return true;
  }
  return false;
}

describe("I1 — doigtés de gamme", () => {
  it("un exercice conjoint déclare une table de doigtés par tonalité", () => {
    // Sans cette règle, on pourrait réintroduire une gamme sous forme de doigté
    // fixe transposé aux 12 tonalités — ce que le prototype faisait pour la
    // pentatonique — et contourner tout le reste du fichier.
    for (const e of EXERCICES) {
      if (!estConjoint(e)) continue;
      expect(
        aTableDeDoigtes(e),
        `« ${e.name} » se joue par degrés voisins : son doigté doit figurer tonalité par tonalité dans \`fing\`, pas dans \`hands\`.`,
      ).toBe(true);
    }
  });

  it("les tonalités proposées sont exactement celles dont le doigté est écrit", () => {
    for (const e of EXERCICES.filter(aTableDeDoigtes)) {
      const ecrites = Object.keys(e.fing!)
        .map(Number)
        .sort((a, b) => a - b);
      const proposees = [...e.keys].sort((a, b) => a - b);
      expect(proposees, `« ${e.name} »`).toEqual(ecrites);
    }
  });

  it("chaque table de doigtés couvre la gamme entière plus l'octave", () => {
    for (const e of EXERCICES.filter(aTableDeDoigtes)) {
      expect(e.scale, `« ${e.name} » déclare \`fing\` sans \`scale\``).toBeDefined();
      const attendu = e.scale!.length + 1;
      for (const [tonalite, mains] of Object.entries(e.fing!)) {
        for (const [main, doigtes] of Object.entries(mains ?? {})) {
          expect(doigtes.length, `« ${e.name} », ${main} en ${tonalite}`).toBe(attendu);
        }
      }
    }
  });

  it("le pouce ne tombe jamais sur une touche noire dans un exercice conjoint", () => {
    // C'est la raison musicale de I1 : le pouce passe sous la main, et une touche
    // noire — plus haute et en retrait — rend ce passage irrégulier. Cette règle
    // a écarté six tonalités de la pentatonique, dont Mi♭ mineur, que le
    // prototype proposait avec le pouce sur une noire.
    for (const e of EXERCICES.filter(aTableDeDoigtes)) {
      for (const tonique of e.keys) {
        for (const main of MAINS) {
          const pas = pasDExercice(e, main, tonique);
          if (!pas) continue;
          for (const p of pas) {
            p.f.forEach((doigt, i) => {
              if (doigt !== 1) return;
              const hauteur = tonique + p.n[i]!;
              expect(
                estNoire(hauteur),
                `« ${e.name} » en ${tonique}, ${main} : pouce sur une touche noire.`,
              ).toBe(false);
            });
          }
        }
      }
    }
  });
});

describe("I1 — la règle n'est pas vide", () => {
  it("rejette la pentatonique telle que le prototype la définissait", () => {
    // Preuve que le test ci-dessus mord. Définition d'origine :
    // doigté fixe [1,2,3,1,2,3,2,1,3,2] proposé sur les douze tonalités.
    // Le pouce y tombe sur la tonique et sur la quinte ; en Mi♭ mineur, les deux
    // sont des touches noires.
    const pouceSur = [0, 7];
    const fautives = Array.from({ length: 12 }, (_, t) => t as PitchClass).filter((tonique) =>
      pouceSur.some((intervalle) => estNoire(tonique + intervalle)),
    );

    expect(fautives.length).toBeGreaterThan(0);
    expect(fautives).toContain(3); // Mi♭
    // Et aucune de ces tonalités n'est proposée aujourd'hui.
    const penta = EXERCICES.find((e) => e.id === "pentatonique-mineure")!;
    for (const t of fautives) expect(penta.keys).not.toContain(t);
  });
});

describe("intégrité des doigtés", () => {
  it("autant de doigts que de notes, et tous entre 1 et 5", () => {
    for (const e of EXERCICES) {
      for (const main of MAINS) {
        for (const tonique of e.keys) {
          const pas = pasDExercice(e, main, tonique);
          if (!pas) continue;
          for (const p of pas) {
            expect(p.f.length, `« ${e.name} »`).toBe(p.n.length);
            for (const doigt of p.f) {
              expect(doigt, `« ${e.name} »`).toBeGreaterThanOrEqual(1);
              expect(doigt, `« ${e.name} »`).toBeLessThanOrEqual(5);
            }
          }
        }
      }
    }
  });

  it("toute note reste dans la fenêtre du clavier après transposition", () => {
    for (const e of EXERCICES) {
      for (const tonique of e.keys as PitchClass[]) {
        const decalage = tonique - baseDuClavier(tonique);
        for (const main of MAINS) {
          const pas = pasDExercice(e, main, tonique);
          if (!pas) continue;
          for (const p of pas) {
            for (const n of p.n) {
              expect(n + decalage, `« ${e.name} » en ${tonique}`).toBeGreaterThanOrEqual(0);
              expect(n + decalage, `« ${e.name} » en ${tonique}`).toBeLessThanOrEqual(24);
            }
          }
        }
      }
    }
  });

  it("chaque exercice est jouable par au moins une main dans chaque tonalité proposée", () => {
    for (const e of EXERCICES) {
      for (const tonique of e.keys) {
        const jouable = MAINS.some((m) => pasDExercice(e, m, tonique) !== null);
        expect(jouable, `« ${e.name} » en ${tonique} n'a de doigté pour aucune main`).toBe(true);
      }
    }
  });
});
