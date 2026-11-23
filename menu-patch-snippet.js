// Menu localizer function to append to dist/menu.js
const menuTranslations = {
  'File': 'ファイル',
  'Edit': '編集',
  'View': '表示',
  'Window': 'ウィンドウ',
  'Help': 'ヘルプ',
  'New Window': '新しいウィンドウ',
  'Docs': 'ドキュメント',
  'Check for Updates': '更新を確認',
  'Undo': '元に戻す',
  'Redo': 'やり直し',
  'Cut': '切り取り',
  'Copy': 'コピー',
  'Paste': '貼り付け',
  'Select All': 'すべて選択',
  'Reload': '再読み込み',
  'Force Reload': '強制的に再読み込み',
  'Actual Size': '実際のサイズ',
  'Zoom In': '拡大',
  'Zoom Out': '縮小',
  'Toggle Full Screen': '全画面表示の切り替え',
  'Minimize': '最小化',
  'Close': '閉じる'
};

function translateMenuItems(menu) {
  if (!menu || !menu.items) return;
  for (const item of menu.items) {
    if (item.label && menuTranslations[item.label]) {
      item.label = menuTranslations[item.label];
    }
    if (item.submenu) {
      translateMenuItems(item.submenu);
    }
  }
}
