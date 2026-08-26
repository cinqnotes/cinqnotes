/**
 * Le bug que ces tests verrouillent : le prototype dérivait la clé de date de
 * `toISOString()`, qui rend l'heure UTC. Une séance jouée à 00:30 en France
 * était donc comptée la veille, et la série de jours — le seul chiffre que
 * CLAUDE.md §8 juge prédictif — était fausse pour qui pratique tard le soir.
 */
import { describe, expect, it } from "vitest";
import {
  ancienneteEnJours,
  cleDeDate,
  cleDeJourDeSemaine,
  paliersDeRetour,
  semaineCourante,
  serie,
} from "~/lib/horloge";

describe("clé de date", () => {
  it("rend la date locale, pas la date UTC", () => {
    // 24 août 2026, 00:30 heure locale. En UTC+2 c'est encore le 23 en UTC.
    const minuitPasse = new Date(2026, 7, 24, 0, 30);
    expect(cleDeDate(minuitPasse)).toBe("2026-08-24");
  });

  it("tient jusqu'à la dernière minute de la journée", () => {
    expect(cleDeDate(new Date(2026, 7, 24, 23, 59))).toBe("2026-08-24");
  });

  it("complète les mois et les jours à deux chiffres", () => {
    expect(cleDeDate(new Date(2026, 0, 5, 12, 0))).toBe("2026-01-05");
  });
});

describe("semaine", () => {
  // 2026-08-24 est un lundi.
  const lundi = new Date(2026, 7, 24, 10, 0);
  const dimanche = new Date(2026, 7, 30, 10, 0);

  it("la semaine démarre le lundi et se termine le dimanche", () => {
    expect(semaineCourante(lundi)).toEqual([
      "2026-08-24", "2026-08-25", "2026-08-26", "2026-08-27",
      "2026-08-28", "2026-08-29", "2026-08-30",
    ]);
  });

  it("le dimanche ferme la semaine en cours, il n'en ouvre pas une nouvelle", () => {
    // Le prototype calculait `weekday - getDay()`, ce qui plaçait le lundi
    // dans le futur quand on était dimanche.
    expect(cleDeJourDeSemaine(1, dimanche)).toBe("2026-08-24");
    expect(cleDeJourDeSemaine(0, dimanche)).toBe("2026-08-30");
  });

  it("un jour de la semaine renvoie la même clé quel que soit le jour de consultation", () => {
    const mercredi = new Date(2026, 7, 26, 18, 0);
    expect(cleDeJourDeSemaine(5, lundi)).toBe(cleDeJourDeSemaine(5, mercredi));
  });
});

describe("série de jours", () => {
  const aujourdhui = new Date(2026, 7, 24, 21, 0);

  it("compte les jours consécutifs jusqu'à aujourd'hui", () => {
    const jours = new Set(["2026-08-24", "2026-08-23", "2026-08-22"]);
    expect(serie(jours, aujourdhui)).toBe(3);
  });

  it("ne casse pas la série tant que la journée en cours n'est pas entamée", () => {
    // À 9 h du matin, personne ne mérite de voir sa série remise à zéro.
    const jours = new Set(["2026-08-23", "2026-08-22"]);
    expect(serie(jours, aujourdhui)).toBe(2);
  });

  it("s'arrête au premier jour manqué", () => {
    const jours = new Set(["2026-08-24", "2026-08-22", "2026-08-21"]);
    expect(serie(jours, aujourdhui)).toBe(1);
  });

  it("vaut zéro quand rien n'a jamais été fait", () => {
    expect(serie(new Set(), aujourdhui)).toBe(0);
  });
});

/**
 * C'est le chiffre sur lequel se décide le passage en phase 2
 * (CLAUDE.md §8 phase 1). Il ne se mesure nulle part ailleurs : une audience
 * sans cookie ne reconnaît pas quelqu'un quinze jours plus tard.
 */
describe("retour différé", () => {
  it("n'existe pas sans pratique", () => {
    expect(ancienneteEnJours(new Set())).toBeNull();
    expect(paliersDeRetour(new Set())).toEqual([]);
  });

  it("vaut zéro pour un seul jour de pratique", () => {
    expect(ancienneteEnJours(new Set(["2026-08-10"]))).toBe(0);
    expect(paliersDeRetour(new Set(["2026-08-10"]))).toEqual([]);
  });

  it("compte l'écart entre la première et la dernière pratique", () => {
    expect(ancienneteEnJours(new Set(["2026-08-10", "2026-08-17"]))).toBe(7);
  });

  it("ne dépend pas de la continuité — c'est là qu'il diffère de la série", () => {
    // Lundi, jeudi, samedi, puis retour à J+14 : la série vaut 1, et pourtant
    // c'est exactement le profil d'utilisateur que la phase 1 cherche.
    const jours = new Set(["2026-08-10", "2026-08-13", "2026-08-15", "2026-08-24"]);
    expect(ancienneteEnJours(jours)).toBe(14);
    expect(paliersDeRetour(jours)).toEqual([14, 7]);
    expect(serie(jours, new Date(2026, 7, 24, 20))).toBe(1);
  });

  it("franchit le palier exactement à J+7 et à J+14", () => {
    expect(paliersDeRetour(new Set(["2026-08-10", "2026-08-16"]))).toEqual([]);
    expect(paliersDeRetour(new Set(["2026-08-10", "2026-08-17"]))).toEqual([7]);
    expect(paliersDeRetour(new Set(["2026-08-10", "2026-08-23"]))).toEqual([7]);
    expect(paliersDeRetour(new Set(["2026-08-10", "2026-08-24"]))).toEqual([14, 7]);
  });

  it("résiste au changement d'heure", () => {
    // Le passage à l'heure d'hiver en Europe tombe fin octobre : un calcul en
    // millisecondes sur des dates à minuit y perdrait une journée.
    expect(ancienneteEnJours(new Set(["2026-10-20", "2026-11-03"]))).toBe(14);
  });

  it("ignore l'ordre d'insertion", () => {
    const desordre = new Set(["2026-08-24", "2026-08-10", "2026-08-15"]);
    expect(ancienneteEnJours(desordre)).toBe(14);
  });
});
