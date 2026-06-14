const fs = require('fs');

const trTranslations = {
  loading: "Admin verileri yükleniyor...",
  error_fetch: "Sistem bilgileri yüklenirken bir hata oluştu.",
  success_update: "Kullanıcı başarıyla güncellendi.",
  error_update: "Kullanıcı güncellenirken hata oluştu.",
  confirm_delete: "Bu kullanıcıyı sistemden silmek istediğinize emin misiniz?",
  success_delete: "Kullanıcı silindi.",
  error_delete: "Kullanıcı silinirken hata oluştu.",
  success_freeze: "Kullanıcı hesabı donduruldu.",
  success_unfreeze: "Kullanıcı hesabı aktifleştirildi.",
  error_freeze: "İşlem sırasında hata oluştu.",
  title: "Admin Kontrol Paneli",
  subtitle: "Sistem-geneli varlık durumunu, aktif üyeleri izleyin ve kullanıcı hesaplarını modere edin.",
  total_users: "Toplam Kayıtlı Kullanıcı",
  total_balance: "Toplam Sistem Bakiyesi",
  active_experts: "Aktif Sistem Uzmanları",
  total_tx_volume: "Toplam İşlem / Hacim",
  user_balances: "Kullanıcı Bakiyeleri (En Yüksek 15)",
  balance: "Bakiye",
  membership_dist: "Üyelik Dağılımı",
  volume_30d: "Son 30 Günlük İşlem Hacmi (Tahmini)",
  volume: "Hacim",
  user_management: "Kullanıcı Yönetimi",
  listed: "Listeleniyor",
  search_placeholder: "İsim, Email veya Kullanıcı adı...",
  role_filter: "Rol Filtresi",
  membership_filter: "Üyelik Filtresi",
  all: "Tümü",
  table_user: "Kullanıcı",
  table_email: "E-posta",
  table_role: "Rol",
  table_plan: "Plan",
  table_actions: "İşlemler",
  no_users_found: "Kriterlere uygun kullanıcı bulunamadı.",
  frozen: "(Donduruldu)",
  edit_user: "Kullanıcıyı Düzenle",
  unfreeze_account: "Hesabı Aç (Unfreeze)",
  freeze_account: "Hesabı Dondur (Freeze)",
  delete_user: "Kullanıcıyı Sil",
  system_logs: "Sistem İşlem Günlükleri (Son 15 Aktivite)",
  table_tx_type: "İşlem Tipi",
  table_asset: "Varlık/Üyelik",
  table_amount: "Miktar",
  table_unit_price: "Birim Fiyat",
  table_total_amount: "Toplam Tutar",
  table_date: "Tarih",
  deleted_user: "Silinmiş Kullanıcı",
  tx_deposit: "DEPOZİT",
  tx_upgrade: "ABONELİK",
  tx_buy: "ALIŞ",
  tx_sell: "SATIŞ",
  no_tx_found: "Sistemde henüz bir işlem kaydı bulunmuyor.",
  fullname: "Ad Soyad",
  username: "Kullanıcı Adı",
  membership_plan: "Üyelik Planı",
  expert_tier: "Expert Seviyesi",
  cancel: "Vazgeç",
  save_changes: "Değişiklikleri Kaydet"
};

const enTranslations = {
  loading: "Loading admin data...",
  error_fetch: "An error occurred while loading system information.",
  success_update: "User successfully updated.",
  error_update: "An error occurred while updating user.",
  confirm_delete: "Are you sure you want to delete this user from the system?",
  success_delete: "User deleted.",
  error_delete: "An error occurred while deleting user.",
  success_freeze: "User account frozen.",
  success_unfreeze: "User account activated.",
  error_freeze: "An error occurred during the operation.",
  title: "Admin Dashboard",
  subtitle: "Monitor system-wide assets, active members, and moderate user accounts.",
  total_users: "Total Registered Users",
  total_balance: "Total System Balance",
  active_experts: "Active System Experts",
  total_tx_volume: "Total Transactions / Volume",
  user_balances: "User Balances (Top 15)",
  balance: "Balance",
  membership_dist: "Membership Distribution",
  volume_30d: "Last 30 Days Trading Volume (Estimated)",
  volume: "Volume",
  user_management: "User Management",
  listed: "Listed",
  search_placeholder: "Name, Email or Username...",
  role_filter: "Role Filter",
  membership_filter: "Membership Filter",
  all: "All",
  table_user: "User",
  table_email: "Email",
  table_role: "Role",
  table_plan: "Plan",
  table_actions: "Actions",
  no_users_found: "No users found matching the criteria.",
  frozen: "(Frozen)",
  edit_user: "Edit User",
  unfreeze_account: "Unfreeze Account",
  freeze_account: "Freeze Account",
  delete_user: "Delete User",
  system_logs: "System Transaction Logs (Last 15 Activities)",
  table_tx_type: "Transaction Type",
  table_asset: "Asset/Membership",
  table_amount: "Amount",
  table_unit_price: "Unit Price",
  table_total_amount: "Total Amount",
  table_date: "Date",
  deleted_user: "Deleted User",
  tx_deposit: "DEPOSIT",
  tx_upgrade: "SUBSCRIPTION",
  tx_buy: "BUY",
  tx_sell: "SELL",
  no_tx_found: "No transaction records found in the system yet.",
  fullname: "Full Name",
  username: "Username",
  membership_plan: "Membership Plan",
  expert_tier: "Expert Tier",
  cancel: "Cancel",
  save_changes: "Save Changes"
};

// Replace JSON
const updateJson = (path, translations) => {
  const content = JSON.parse(fs.readFileSync(path, 'utf8'));
  content.admin = translations;
  fs.writeFileSync(path, JSON.stringify(content, null, 2), 'utf8');
}

updateJson('c:/Users/bekta/OneDrive/Masaüstü/portfol.io/client/src/locales/tr.json', trTranslations);
updateJson('c:/Users/bekta/OneDrive/Masaüstü/portfol.io/client/src/locales/en.json', enTranslations);

let adminCode = fs.readFileSync('c:/Users/bekta/OneDrive/Masaüstü/portfol.io/client/src/pages/AdminPage.tsx', 'utf8');

if (!adminCode.includes('import { useTranslation }')) {
  adminCode = adminCode.replace("import { useCurrency } from '../contexts/CurrencyContext';", "import { useCurrency } from '../contexts/CurrencyContext';\nimport { useTranslation } from 'react-i18next';");
}

if (!adminCode.includes('const { t } = useTranslation()')) {
  adminCode = adminCode.replace('const { enqueueSnackbar } = useSnackbar();', 'const { enqueueSnackbar } = useSnackbar();\n  const { t } = useTranslation();');
}

// Map replacements
const replacements = [
  ["'Admin verileri yükleniyor...'", "t('admin.loading')"],
  ["'Sistem bilgileri yüklenirken bir hata oluştu.'", "t('admin.error_fetch')"],
  ["'Kullanıcı başarıyla güncellendi.'", "t('admin.success_update')"],
  ["'Kullanıcı güncellenirken hata oluştu.'", "t('admin.error_update')"],
  ["'Bu kullanıcıyı sistemden silmek istediğinize emin misiniz?'", "t('admin.confirm_delete')"],
  ["'Kullanıcı silindi.'", "t('admin.success_delete')"],
  ["'Kullanıcı silinirken hata oluştu.'", "t('admin.error_delete')"],
  ["'Kullanıcı hesabı donduruldu.'", "t('admin.success_freeze')"],
  ["'Kullanıcı hesabı aktifleştirildi.'", "t('admin.success_unfreeze')"],
  ["'İşlem sırasında hata oluştu.'", "t('admin.error_freeze')"],
  ["Admin Kontrol Paneli", "{t('admin.title')}"],
  ["Sistem-geneli varlık durumunu, aktif üyeleri izleyin ve kullanıcı hesaplarını modere edin.", "{t('admin.subtitle')}"],
  ["Toplam Kayıtlı Kullanıcı", "{t('admin.total_users')}"],
  ["Toplam Sistem Bakiyesi", "{t('admin.total_balance')}"],
  ["Aktif Sistem Uzmanları", "{t('admin.active_experts')}"],
  ["Toplam İşlem / Hacim", "{t('admin.total_tx_volume')}"],
  ["Kullanıcı Bakiyeleri (En Yüksek 15)", "{t('admin.user_balances')}"],
  ["'Bakiye'", "t('admin.balance')"],
  ["Üyelik Dağılımı", "{t('admin.membership_dist')}"],
  ["Son 30 Günlük İşlem Hacmi (Tahmini)", "{t('admin.volume_30d')}"],
  ["'Hacim'", "t('admin.volume')"],
  ["Kullanıcı Yönetimi ({filteredUsers.length} Listeleniyor)", "{t('admin.user_management')} ({filteredUsers.length} {t('admin.listed')})"],
  ["placeholder=\"İsim, Email veya Kullanıcı adı...\"", "placeholder={t('admin.search_placeholder')}"],
  [">Rol Filtresi<", ">{t('admin.role_filter')}<"],
  ["label=\"Rol Filtresi\"", "label={t('admin.role_filter')}"],
  [">Üyelik Filtresi<", ">{t('admin.membership_filter')}<"],
  ["label=\"Üyelik Filtresi\"", "label={t('admin.membership_filter')}"],
  [">Tümü<", ">{t('admin.all')}<"],
  [">Kullanıcı<", ">{t('admin.table_user')}<"],
  [">E-posta<", ">{t('admin.table_email')}<"],
  [">Rol<", ">{t('admin.table_role')}<"],
  [">Plan<", ">{t('admin.table_plan')}<"],
  [">Bakiye<", ">{t('admin.balance')}<"],
  [">İşlemler<", ">{t('admin.table_actions')}<"],
  ["Kriterlere uygun kullanıcı bulunamadı.", "{t('admin.no_users_found')}"],
  ["(Donduruldu)", "({t('admin.frozen')})"],
  ["title=\"Kullanıcıyı Düzenle\"", "title={t('admin.edit_user')}"],
  ["\"Hesabı Aç (Unfreeze)\"", "t('admin.unfreeze_account')"],
  ["\"Hesabı Dondur (Freeze)\"", "t('admin.freeze_account')"],
  ["title=\"Kullanıcıyı Sil\"", "title={t('admin.delete_user')}"],
  ["Sistem İşlem Günlükleri (Son 15 Aktivite)", "{t('admin.system_logs')}"],
  [">İşlem Tipi<", ">{t('admin.table_tx_type')}<"],
  [">Varlık/Üyelik<", ">{t('admin.table_asset')}<"],
  [">Miktar<", ">{t('admin.table_amount')}<"],
  [">Birim Fiyat<", ">{t('admin.table_unit_price')}<"],
  [">Toplam Tutar<", ">{t('admin.table_total_amount')}<"],
  [">Tarih<", ">{t('admin.table_date')}<"],
  ["Silinmiş Kullanıcı", "{t('admin.deleted_user')}"],
  ["label=\"DEPOZİT\"", "label={t('admin.tx_deposit')}"],
  ["label=\"ABONELİK\"", "label={t('admin.tx_upgrade')}"],
  ["label=\"ALIŞ\"", "label={t('admin.tx_buy')}"],
  ["label=\"SATIŞ\"", "label={t('admin.tx_sell')}"],
  ["Sistemde henüz bir işlem kaydı bulunmuyor.", "{t('admin.no_tx_found')}"],
  ["Kullanıcı Düzenle", "{t('admin.edit_user')}"],
  ["label=\"Ad Soyad\"", "label={t('admin.fullname')}"],
  ["label=\"Kullanıcı Adı\"", "label={t('admin.username')}"],
  ["label=\"Üyelik Planı\"", "label={t('admin.membership_plan')}"],
  ["label=\"Expert Seviyesi\"", "label={t('admin.expert_tier')}"],
  [">Vazgeç<", ">{t('admin.cancel')}<"],
  [">Değişiklikleri Kaydet<", ">{t('admin.save_changes')}<"]
];

for (const [search, replace] of replacements) {
  adminCode = adminCode.split(search).join(replace);
}

fs.writeFileSync('c:/Users/bekta/OneDrive/Masaüstü/portfol.io/client/src/pages/AdminPage.tsx', adminCode, 'utf8');

console.log("Done");
