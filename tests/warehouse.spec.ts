import { expect, test, type Page } from '@playwright/test';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name} for Playwright E2E tests.`,
    );
  }
  return value;
}

const CREDS = {
  admin: {
    username: () => requireEnv('EVAL_ADMIN_USERNAME'),
    password: () => requireEnv('EVAL_ADMIN_PASSWORD'),
  },
  auditor: {
    username: () => requireEnv('EVAL_AUDITOR_USERNAME'),
    password: () => requireEnv('EVAL_AUDITOR_PASSWORD'),
  },
  technician: {
    username: () => requireEnv('EVAL_TECHNICIAN_USERNAME'),
    password: () => requireEnv('EVAL_TECHNICIAN_PASSWORD'),
  },
};

async function signIn(page: Page, username: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByTestId('login-submit').click();
  await expect(page.getByTestId('current-username')).toHaveText(username);
}

test.describe('Warehouse Management System E2E', () => {
  test('technician can load, inspect, reject duplicates, and unload a pallet', async ({ page }) => {
    await signIn(page, CREDS.technician.username(), CREDS.technician.password());

    // Verify 5x5 floor, A1 transfer point, and non-color state labels
    const a1 = page.getByTestId('cell-A1');
    await expect(a1).toHaveAttribute('data-state', 'TRANSFER');
    await expect(a1).toContainText('TRANSFER');

    const freeCells = page.locator('[data-testid^="cell-"][data-state="FREE"]');
    await expect(freeCells.first()).toBeVisible();
    const targetTestId = await freeCells.first().getAttribute('data-testid');
    const targetCode = targetTestId!.replace('cell-', '');

    const suffix = Date.now().toString().slice(-6);
    const palletNumber = `PLT-E2E-${suffix}`;
    const barcode = `BC-E2E-${suffix}`;
    const itemName = `E2E Servo Valve ${suffix}`;

    // Select free cell and open Load modal pre-filled with that slot
    await page.getByTestId(`cell-${targetCode}`).click();
    await page.getByTestId('inspector-load-btn').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByLabel('Pallet number').fill(palletNumber);
    await page.getByLabel('Barcode').fill(barcode);
    await page.getByLabel('Item / product name').fill(itemName);
    await page.getByLabel('Quantity').fill('15');
    await expect(page.getByLabel('Destination slot')).toHaveValue(targetCode);
    await page.getByTestId('load-submit-btn').click();

    await expect(page.getByTestId('floor-feedback')).toContainText(palletNumber);
    const targetCell = page.getByTestId(`cell-${targetCode}`);
    await expect(targetCell).toHaveAttribute('data-state', 'OCCUPIED');
    await expect(targetCell).toContainText('OCCUPIED');
    await expect(targetCell).toContainText(palletNumber);

    // Inspect loaded pallet details
    await targetCell.click();
    await expect(page.getByTestId('pallet-detail-number')).toHaveText(palletNumber);
    await expect(page.getByTestId('pallet-detail-barcode')).toHaveText(barcode);
    await expect(page.getByTestId('pallet-detail-item')).toHaveText(itemName);
    await expect(page.getByTestId('pallet-detail-quantity')).toHaveText('15');

    // Failure scenario: duplicate active pallet number is rejected cleanly
    const secondFree = page.locator('[data-testid^="cell-"][data-state="FREE"]').first();
    const secondCode = (await secondFree.getAttribute('data-testid'))!.replace('cell-', '');
    await page.getByTestId('open-load-dialog-btn').click();
    await page.getByLabel('Pallet number').fill(palletNumber);
    await page.getByLabel('Barcode').fill(`BC-DUP-${suffix}`);
    await page.getByLabel('Item / product name').fill('Duplicate Test');
    await page.getByLabel('Quantity').fill('2');
    await page.getByLabel('Destination slot').selectOption(secondCode);
    await page.getByTestId('load-submit-btn').click();
    await expect(page.getByTestId('load-modal-error')).toContainText('already stored');
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Unload target slot back to A1
    await page.getByTestId(`cell-${targetCode}`).click();
    await page.getByTestId('unload-pallet-btn').click();
    await expect(page.getByTestId('floor-feedback')).toContainText('unloaded');
    await expect(targetCell).toHaveAttribute('data-state', 'FREE');
  });

  test('changes made in one session appear in another session within 5 seconds', async ({
    browser,
  }) => {
    const techContext = await browser.newContext();
    const auditorContext = await browser.newContext();
    const techPage = await techContext.newPage();
    const auditorPage = await auditorContext.newPage();

    try {
      await signIn(techPage, CREDS.technician.username(), CREDS.technician.password());
      await signIn(auditorPage, CREDS.auditor.username(), CREDS.auditor.password());

      const freeCell = techPage.locator('[data-testid^="cell-"][data-state="FREE"]').first();
      const targetCode = (await freeCell.getAttribute('data-testid'))!.replace('cell-', '');
      const suffix = Date.now().toString().slice(-6);
      const palletNumber = `PLT-SYNC-${suffix}`;

      await techPage.getByTestId(`cell-${targetCode}`).click();
      await techPage.getByTestId('inspector-load-btn').click();
      await techPage.getByLabel('Pallet number').fill(palletNumber);
      await techPage.getByLabel('Barcode').fill(`BC-SYNC-${suffix}`);
      await techPage.getByLabel('Item / product name').fill('Sync Test Rotor');
      await techPage.getByLabel('Quantity').fill('9');
      await techPage.getByTestId('load-submit-btn').click();

      // Auditor browser must observe the new pallet without reloading within 5 seconds
      const auditorCell = auditorPage.getByTestId(`cell-${targetCode}`);
      await expect(auditorCell).toHaveAttribute('data-state', 'OCCUPIED', { timeout: 5000 });
      await expect(auditorCell).toContainText(palletNumber, { timeout: 5000 });

      // Clean up by unloading and confirming sync back to FREE
      await techPage.getByTestId(`cell-${targetCode}`).click();
      await techPage.getByTestId('unload-pallet-btn').click();
      await expect(auditorCell).toHaveAttribute('data-state', 'FREE', { timeout: 5000 });
    } finally {
      await techContext.close();
      await auditorContext.close();
    }
  });

  test('auditor is read-only and can inspect shuttle status and 7-day dashboard', async ({
    page,
  }) => {
    await signIn(page, CREDS.auditor.username(), CREDS.auditor.password());

    await expect(page.getByTestId('open-load-dialog-btn')).toHaveCount(0);
    await page.locator('[data-testid^="cell-"][data-state="OCCUPIED"]').first().click();
    await expect(page.getByTestId('unload-pallet-btn')).toHaveCount(0);
    await expect(page.getByTestId('location-inspector')).toContainText('read-only');

    // Shuttle status page
    await page.getByRole('link', { name: 'Shuttle Status' }).click();
    await expect(page.getByTestId('shuttle-identifier')).toHaveText('SH-01');
    await expect(page.getByTestId('shuttle-status')).toBeVisible();
    await expect(page.getByTestId('shuttle-battery')).toContainText('%');

    // Auditor dashboard
    await page.getByRole('link', { name: 'Auditor Dashboard' }).click();
    await expect(page.getByTestId('auditor-occupied-count')).toContainText('/ 24');
    await expect(page.getByTestId('auditor-free-count')).toContainText('/ 24');
    await expect(page.getByTestId('occupancy-chart')).toBeVisible();

    // Direct navigation to admin page is blocked
    await page.goto('/users');
    await expect(page.getByRole('alert')).toContainText('Access denied');
  });

  test('admin can manage users and floor remains usable on mobile viewport', async ({
    browser,
  }) => {
    const adminContext = await browser.newContext({
      viewport: { width: 375, height: 812 },
    });
    const adminPage = await adminContext.newPage();

    try {
      await signIn(adminPage, CREDS.admin.username(), CREDS.admin.password());

      // Mobile floor sanity check: A1 and E5 fit without breaking layout
      await expect(adminPage.getByTestId('cell-A1')).toBeVisible();
      await expect(adminPage.getByTestId('cell-E5')).toBeVisible();

      // Open mobile menu and navigate to User Admin
      await adminPage.getByRole('button', { name: 'Open navigation menu' }).click();
      await adminPage.getByRole('link', { name: 'User Admin' }).click();

      const tempUsername = `pw_user_${Date.now().toString().slice(-6)}`;
      const tempPassword = 'TempUserPass123!';

      await adminPage.getByTestId('open-create-user-btn').click();
      const createDialog = adminPage.getByRole('dialog');
      await createDialog.getByLabel('Username').fill(tempUsername);
      await createDialog.getByLabel('Password (min 8 chars, no spaces)').fill(tempPassword);
      await createDialog.getByLabel('Role', { exact: true }).selectOption('technician');
      await createDialog.getByTestId('create-user-submit').click();

      const userRow = adminPage.getByTestId(`user-row-${tempUsername}`);
      await expect(userRow).toBeVisible();

      // Reassign role to auditor
      await adminPage.getByLabel(`Role for ${tempUsername}`).selectOption('auditor');
      await expect(adminPage.getByTestId('users-feedback')).toContainText('auditor');

      // Reset password for the newly created user
      const updatedPassword = 'UpdatedTempPass456!';
      await userRow.getByRole('button', { name: 'Reset Password' }).click();
      const resetDialog = adminPage.getByRole('dialog');
      await resetDialog.getByLabel('New password').fill(updatedPassword);
      await resetDialog.getByRole('button', { name: 'Save Password' }).click();
      await expect(adminPage.getByTestId('users-feedback')).toContainText('Password updated');

      // Verify new user can sign in with updated password and auditor role
      const tempContext = await browser.newContext();
      const tempPage = await tempContext.newPage();
      await signIn(tempPage, tempUsername, updatedPassword);
      await expect(tempPage.getByTestId('current-user-role')).toHaveText('Auditor');
      await tempContext.close();

      // Remove user access and confirm login fails afterwards
      await adminPage.getByTestId(`delete-user-${tempUsername}`).click();
      await expect(userRow).toHaveCount(0);

      const revokedContext = await browser.newContext();
      const revokedPage = await revokedContext.newPage();
      await revokedPage.goto('/login');
      await revokedPage.getByLabel('Username').fill(tempUsername);
      await revokedPage.getByLabel('Password').fill(updatedPassword);
      await revokedPage.getByTestId('login-submit').click();
      await expect(revokedPage.getByTestId('login-error')).toBeVisible();
      await revokedContext.close();
    } finally {
      await adminContext.close();
    }
  });
});
