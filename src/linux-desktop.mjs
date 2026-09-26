import path from 'node:path';

// Desktop-entry string escaping is applied before Exec argument unquoting.
export function quoteDesktopArgument(value) {
  if (/[\r\n\0]/.test(value)) throw new Error('Invalid desktop launcher path.');
  return `"${String(value).replace(/\\/g, '\\\\\\\\').replace(/["`$]/g, '\\\\$&').replace(/%/g, '%%')}"`;
}

export function linuxAutostartEntry({ executable, appPath, packaged, appImage }) {
  const args = [appImage || executable];
  if (!appImage && !packaged) args.push(appPath);
  return [
    '[Desktop Entry]', 'Type=Application', 'Name=Toledo Sync',
    `Exec=${args.map(quoteDesktopArgument).join(' ')}`,
    'Icon=toledo-sync', 'Terminal=false', 'X-GNOME-Autostart-enabled=true', ''
  ].join('\n');
}

export function linuxAutostartPath(home, env = process.env) {
  const root = env.XDG_CONFIG_HOME && path.isAbsolute(env.XDG_CONFIG_HOME)
    ? env.XDG_CONFIG_HOME : path.join(home, '.config');
  return path.join(root, 'autostart', 'toledo-sync.desktop');
}
