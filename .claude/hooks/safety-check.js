// Hook de seguridad — bloquea comandos bash destructivos
process.stdin.resume();
process.stdin.setEncoding('utf8');
let data = '';
process.stdin.on('data', chunk => { data += chunk; });
process.stdin.on('end', () => {
  let cmd = '';
  try { cmd = JSON.parse(data).command || ''; } catch (e) {}

  const peligrosos = [
    { regex: /rm\s+-rf/,               desc: 'rm -rf (borrado permanente)' },
    { regex: /git\s+push\s+.*--force/, desc: 'git push --force (sobrescribe remoto)' },
    { regex: /git\s+reset\s+--hard/,   desc: 'git reset --hard (pierde cambios)' },
    { regex: /git\s+checkout\s+--\s+/, desc: 'git checkout -- (revierte archivos)' },
    { regex: /git\s+clean\s+-f/,       desc: 'git clean -f (borra no-trackeados)' },
    { regex: /DROP\s+TABLE/i,          desc: 'DROP TABLE (borra tabla DB)' },
    { regex: /git\s+branch\s+-D\s/,    desc: 'git branch -D (borra rama forzado)' },
  ];

  const encontrado = peligrosos.find(p => p.regex.test(cmd));
  if (encontrado) {
    process.stdout.write(JSON.stringify({
      continue: false,
      stopReason: `🛑 BLOQUEADO — ${encontrado.desc}\nComando: ${cmd}\n\nSi lo necesitas, ejecútalo manualmente en tu terminal.`
    }));
  }
  // Si no es peligroso, no escribe nada → continúa normalmente
});
