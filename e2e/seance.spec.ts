/**
 * Parcours de séance : ce qu'un utilisateur fait réellement.
 * On vérifie la boucle quotidienne — c'est elle le produit (D9).
 */
import { expect, test, type Page } from "@playwright/test";

/**
 * Le contenu de la planche est rendu au build : il est visible avant même que
 * l'îlot soit hydraté. Les commandes, elles, restent désactivées jusque-là —
 * on attend donc l'hydratation plutôt que de cliquer dans le vide.
 */
async function planchePrete(page: Page) {
  const planche = page.locator(".planche");
  await expect(planche.locator(".case").first()).toBeEnabled();
  return planche;
}

test.describe("séance quotidienne", () => {
  test("le contenu est lisible avant hydratation, les commandes sont inertes", async ({ page }) => {
    await page.goto("/", { waitUntil: "commit" });
    // On ne ment pas à l'utilisateur : tant que rien ne répond, rien n'est actif.
    await expect(page.locator(".planche .bloc").first()).toBeVisible();
  });

  test("cocher un bloc met à jour l'avancement et la série", async ({ page }) => {
    await page.goto("/");

    const planche = await planchePrete(page);
    await expect(planche.locator(".onglet[aria-selected='true']")).toBeVisible();

    const serie = planche.locator(".stat b").first();
    await expect(serie).toHaveText("0");

    const premiereCase = planche.locator(".case").first();
    await premiereCase.click();

    await expect(premiereCase).toHaveAttribute("aria-pressed", "true");
    await expect(serie).toHaveText("1");

    const barre = planche.locator("[role='progressbar']");
    expect(Number(await barre.getAttribute("aria-valuenow"))).toBeGreaterThan(0);
  });

  test("l'état survit au rechargement", async ({ page }) => {
    await page.goto("/");
    const planche = await planchePrete(page);
    await planche.locator(".case").first().click();
    // Cocher s'écrit immédiatement, sans attendre le différé : un onglet fermé
    // dans la seconde ne doit pas coûter la journée à l'utilisateur.
    await expect(page.locator(".sauvegarde")).toHaveText("Enregistré");

    await page.reload();
    await expect(page.locator(".planche .case").first()).toHaveAttribute("aria-pressed", "true");
  });

  test("le journal se sauvegarde et se recharge", async ({ page }) => {
    await page.goto("/");
    await planchePrete(page);
    const journal = page.locator(".planche textarea");
    await journal.fill("Tempo 60 tenu, la main gauche décroche sur le renversement.");
    await expect(page.locator(".sauvegarde")).toHaveText("Enregistré");

    await page.reload();
    await expect(page.locator(".planche textarea")).toHaveValue(
      "Tempo 60 tenu, la main gauche décroche sur le renversement.",
    );
  });

  test("changer de jour change la séance affichée", async ({ page }) => {
    await page.goto("/");
    const planche = await planchePrete(page);
    await planche.locator(".onglet", { hasText: "Sam" }).click();
    await expect(planche.locator("h2")).toHaveText("Samedi");
    await expect(planche.getByText("Relever un morceau que tu aimes")).toBeVisible();
  });

  test("le chronomètre démarre sur le bloc choisi", async ({ page }) => {
    await page.goto("/");
    const planche = await planchePrete(page);
    await planche.locator(".chrono").first().click();
    await expect(planche.locator(".horloge")).toHaveText("05:00");
    await expect(planche.locator(".en-cours")).toContainText("Technique");
  });

  test("sélectionner un bloc affiche son doigté", async ({ page }) => {
    await page.goto("/");
    const planche = await planchePrete(page);
    await planche
      .locator(".lien-bloc", { hasText: "Triades majeures + les 3 renversements" })
      .click();
    await expect(planche.locator(".clavier-panneau .nom")).toContainText("Accord majeur");
    await expect(planche.locator(".clavier-panneau svg")).toBeVisible();
  });

  test("changer de tonalité ne propose que les doigtés vérifiés (I1)", async ({ page }) => {
    await page.goto("/");
    const planche = await planchePrete(page);
    await planche
      .locator(".lien-bloc", { hasText: "Gamme de Do, mains séparées puis ensemble" })
      .click();

    const selecteur = planche.locator(".clavier-panneau select");
    // La gamme majeure n'existe que dans les sept tonalités dont le doigté est écrit.
    await expect(selecteur.locator("option")).toHaveCount(7);
    await selecteur.selectOption({ label: "Si♭" });
    await expect(planche.locator(".clavier-panneau .nom")).toContainText("Si♭");
  });
});

test.describe("générateur d'impro", () => {
  test("change de grille et affiche les notes sûres", async ({ page }) => {
    await page.goto("/");
    const gen = page.locator("#generateur .generateur");
    await expect(gen.getByRole("button", { name: "Lumineux" })).toBeEnabled();

    await expect(gen.locator(".accord").first()).toContainText("Lam");
    await gen.getByRole("button", { name: "Lumineux" }).click();
    await expect(gen.locator(".accord").first()).toContainText("La");
    await expect(gen.locator(".accord")).toHaveCount(4);

    await gen.getByRole("button", { name: "Do", exact: true }).click();
    await expect(gen.locator(".accord").first()).toContainText("Do");
    await expect(gen.locator("svg")).toBeVisible();
  });

  test("la page dédiée d'une grille est complète sans JavaScript", async ({ browser }) => {
    const contexte = await browser.newContext({ javaScriptEnabled: false });
    const page = await contexte.newPage();
    await page.goto("/impro/melancolique-la");

    await expect(page.locator("h1")).toContainText("La");
    await expect(page.locator("table.accords tbody tr")).toHaveCount(4);
    await expect(page.locator(".schema svg")).toBeVisible();
    await expect(page.getByText("Trois notes maximum par phrase")).toBeVisible();
    await contexte.close();
  });

  test("la routine est lisible sans JavaScript", async ({ browser }) => {
    const contexte = await browser.newContext({ javaScriptEnabled: false });
    const page = await contexte.newPage();
    await page.goto("/routine/mercredi");

    await expect(page.locator("h1")).toHaveText("Mercredi");
    await expect(page.locator(".bloc")).toHaveCount(5);
    // Mercredi référence quatre exercices : gamme, grille, basse-accord, grille.
    await expect(page.locator(".schema svg")).toHaveCount(4);
    await contexte.close();
  });
});

test.describe("accessibilité", () => {
  test("la séance se pilote entièrement au clavier", async ({ page }) => {
    await page.goto("/");
    const planche = await planchePrete(page);

    // On atteint la première case à cocher uniquement par Tab, puis on l'active.
    const premiereCase = planche.locator(".case").first();
    await premiereCase.focus();
    await expect(premiereCase).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(premiereCase).toHaveAttribute("aria-pressed", "true");

    // Le titre de bloc est un bouton : il est atteignable et sélectionne le bloc.
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await expect(planche.locator(".bloc.selectionne")).toHaveCount(1);
  });

  test("chaque page a un titre de premier niveau unique", async ({ page }) => {
    for (const chemin of ["/", "/roadmap", "/a-propos", "/routine/lundi", "/impro/groove-do"]) {
      await page.goto(chemin);
      await expect(page.locator("h1")).toHaveCount(1);
    }
  });
});
