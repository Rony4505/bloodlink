import {
  createDonor,
  deleteDonor,
  getStorageHealth,
  listDonors,
  STORAGE_NOT_DURABLE,
  updateAdminSettings,
} from "../src/lib/db";

async function main() {
  const health = await getStorageHealth();
  console.log("health1", {
    backend: health.backend,
    durable: health.durable,
    donorCount: health.donorCount,
    dataDir: health.dataDir,
    onRailway: health.onRailway,
  });

  if (process.env.EXPECT_BLOCK === "1") {
    let blocked = false;
    try {
      await createDonor({
        name: "X",
        email: "x@y.com",
        phone: "01700000002",
        passwordHash: "x",
        gender: "male",
        bloodGroup: "O+",
        district: "Dhaka",
        area: "A",
        lastDonationDate: null,
        bloodIssue: "",
      });
    } catch (e) {
      blocked = e instanceof Error && e.message === STORAGE_NOT_DURABLE;
      console.log("blocked as expected:", e instanceof Error ? e.message : e);
    }
    if (!blocked) throw new Error("expected STORAGE_NOT_DURABLE");
    console.log("OK railway guard");
    return;
  }

  const d = await createDonor({
    name: "Test",
    email: "t@example.com",
    phone: "01700000000",
    passwordHash: "x",
    gender: "male",
    bloodGroup: "O+",
    district: "Dhaka",
    area: "Mirpur",
    lastDonationDate: null,
    bloodIssue: "",
  });
  console.log("created", d.id);

  await updateAdminSettings({
    privacyBn: "updated privacy after registration must keep donors",
  });
  const after = await listDonors();
  console.log("after privacy edit donors", after.length);
  if (after.length !== 1) throw new Error("donors wiped on edit");

  await deleteDonor(d.id);
  const afterDel = await listDonors();
  console.log("after delete", afterDel.length);
  if (afterDel.length !== 0) throw new Error("delete failed");
  console.log("OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
