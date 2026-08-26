/**
 * Le chiffre sur lequel se décide le passage en phase 2 (CLAUDE.md §8 phase 1) :
 * « revenus à 2 semaines, 15-25 personnes ».
 *
 * Il ne se mesure nulle part ailleurs. Umami est sans cookie et son identifiant
 * tourne chaque jour : il ne peut pas reconnaître quelqu'un revenu quinze jours
 * plus tard. Le seul état qui le sache est le `localStorage` de l'appareil.
 *
 * On amorce donc cet historique plutôt que de toucher à l'horloge système, et on
 * vérifie les deux façons de se tromper : ne pas compter un retour réel, ou
 * compter plusieurs fois la même personne.
 */
import { expect, test } from "./fixtures";

/** Amorce l'historique local comme si la personne pratiquait depuis 20 jours. */
async function amorcer(page: import("@playwright/test").Page, joursEcoules: number) {
  await page.addInitScript(
    ([ecoules]) => {
      const w = window as unknown as { umami: unknown; __ev: string[] };
      w.__ev = [];
      w.umami = { track: (nom: string) => w.__ev.push(nom) };

      const cle = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const premier = new Date();
      premier.setDate(premier.getDate() - (ecoules as number));
      localStorage.setItem(
        "piano:v1",
        JSON.stringify({ [cle(premier)]: { done: [0], note: "" } }),
      );
    },
    [joursEcoules],
  );
}

const evenements = (page: import("@playwright/test").Page) =>
  page.evaluate(() => (window as unknown as { __ev: string[] }).__ev);

test("retour à J+20 : les deux paliers partent", async ({ page }) => {
  await amorcer(page, 20);
  await page.goto("/");
  await expect(page.locator(".planche .case").first()).toBeEnabled();
  await page.locator(".planche .case").first().click();
  await expect(page.locator(".sauvegarde")).toHaveText("Enregistré");

  const ev = await evenements(page);
  expect(ev).toContain("retour_j7");
  expect(ev).toContain("retour_j14");
});

test("retour à J+10 : seul le palier 7 part", async ({ page }) => {
  await amorcer(page, 10);
  await page.goto("/");
  await expect(page.locator(".planche .case").first()).toBeEnabled();
  await page.locator(".planche .case").first().click();
  await expect(page.locator(".sauvegarde")).toHaveText("Enregistré");

  const ev = await evenements(page);
  expect(ev).toContain("retour_j7");
  expect(ev).not.toContain("retour_j14");
});

test("premier jour : aucun palier", async ({ page }) => {
  await amorcer(page, 0);
  await page.goto("/");
  await expect(page.locator(".planche .case").first()).toBeEnabled();
  await page.locator(".planche .case").first().click();
  await expect(page.locator(".sauvegarde")).toHaveText("Enregistré");

  const ev = await evenements(page);
  expect(ev.filter((e) => e.startsWith("retour_"))).toHaveLength(0);
});

test("un utilisateur fidèle ne regonfle pas le compteur", async ({ page }) => {
  await amorcer(page, 20);
  await page.goto("/");
  await expect(page.locator(".planche .case").first()).toBeEnabled();
  await page.locator(".planche .case").first().click();
  await expect(page.locator(".sauvegarde")).toHaveText("Enregistré");

  // Deuxième visite le lendemain, puis une troisième : le palier reste vrai,
  // mais l'événement ne doit plus repartir.
  await page.reload();
  await expect(page.locator(".planche .case").nth(1)).toBeEnabled();
  await page.locator(".planche .case").nth(1).click();
  await page.reload();
  await expect(page.locator(".planche .case").nth(2)).toBeEnabled();
  await page.locator(".planche .case").nth(2).click();

  const ev = await evenements(page);
  expect(ev.filter((e) => e === "retour_j14")).toHaveLength(0);
});
