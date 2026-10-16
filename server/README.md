# Lernhelfer-Server

Konten, Tarife (Base, Pro, Ultra, Ultra+ API), Zahlung per Überweisung oder PayPal mit Verwendungszweck, Freunde-Bonus, Speicher und KI über einen gemeinsamen OpenRouter-Schlüssel. Dieselbe `index.html` wie auf GitHub Pages: Liefert dieser Server sie aus, setzt er `data-server`, und die App arbeitet mit Konten statt mit eigenen Schlüsseln. Die GitHub-Pages-Version bleibt unverändert.

- `server.mjs`: der ganze Server, ohne Pakete (Node 24: http, sqlite, crypto). Daten in einer SQLite-Datei.
- `test.mjs`: Prüflauf mit OpenRouter-Attrappe: `node server/test.mjs`
- `recht-vorlage.md`: Vorlage für Impressum, Datenschutz und AGB. Ausfüllen, prüfen lassen und als `recht.md` in den Datenordner legen.

Preise, KI-Kontingente, Gratis-Test und Rabatte stehen oben in `server.mjs` (`TARIFE`, `TEST`). Was welcher Tarif darf, steht in `FUNKTIONEN` (9 = nur in der Admin-Ecke).

## Auf dem Server einrichten (Ubuntu 24.04, etwa netcup oder Hetzner)

Vorher: Die Domain zeigt mit einem A-Eintrag (und AAAA für IPv6) auf die IP des Servers.

```bash
# Node 24 und Caddy (holt das HTTPS-Zertifikat selbst)
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo bash -
sudo apt install -y nodejs debian-keyring debian-archive-keyring apt-transport-https sqlite3
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy
sudo ufw allow OpenSSH && sudo ufw allow 80 && sudo ufw allow 443 && sudo ufw enable

# App und Datenordner
sudo useradd --system --home /var/lib/lernhelfer --create-home lernhelfer
sudo git clone https://github.com/xnik243/lernhelfer /opt/lernhelfer
```

`/etc/lernhelfer.env` anlegen (`sudo nano /etc/lernhelfer.env`, danach `sudo chmod 600 /etc/lernhelfer.env`):

```ini
LH_URL=https://deine-domain.at
LH_PORT=8080
LH_DATEN=/var/lib/lernhelfer
# lange Zufallszeichenkette: openssl rand -hex 32
LH_GEHEIM=
# deine Mail: nur dieses Konto kommt (mit LH_ECKE) in die Admin-Ecke
LH_ADMIN=
# OpenRouter-Schlüssel des Servers, dort mit Monatslimit anlegen
LH_OR_KEY=
# nur für Ultra+: Management-Key von OpenRouter (Settings → Management Keys)
LH_OR_VERWALTUNG=
# Mails über Brevo (kostenlos bis 300 am Tag); Absender muss bei Brevo bestätigt sein
LH_BREVO=
LH_ABSENDER=hallo@deine-domain.at
# Zahlungsdaten auf der Tarifseite
LH_EMPFAENGER=Vorname Nachname
LH_IBAN=
LH_BIC=
LH_PAYPAL=
# Admin-Ecke (Dashboard und volle Werkzeuge): eigenes Passwort, zusätzlich zur Anmeldung mit LH_ADMIN
LH_ECKE=
# Passwörter von Word Power und vollem Löser (dieselben wie in deiner App)
LH_PASS_WORDPOWER=
LH_PASS_ONLINETEST=
```

`/etc/systemd/system/lernhelfer.service`:

```ini
[Unit]
Description=Lernhelfer
After=network.target

[Service]
User=lernhelfer
EnvironmentFile=/etc/lernhelfer.env
WorkingDirectory=/opt/lernhelfer
ExecStart=/usr/bin/node --no-warnings server/server.mjs
Restart=always
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
ReadWritePaths=/var/lib/lernhelfer

[Install]
WantedBy=multi-user.target
```

`/etc/caddy/Caddyfile` (alles andere darin löschen):

```
deine-domain.at {
	encode gzip
	request_body {
		max_size 50MB
	}
	reverse_proxy 127.0.0.1:8080
}
www.deine-domain.at {
	redir https://deine-domain.at{uri} permanent
}
```

```bash
sudo systemctl daemon-reload && sudo systemctl enable --now lernhelfer && sudo systemctl reload caddy
sudo journalctl -u lernhelfer -f    # Log ansehen (Strg+C beendet)
```

Die verschlüsselten Prompts liegen nur im privaten Daten-Repo. Auf dem Server `sudo mkdir -p /var/lib/lernhelfer/geschuetzt`, dann einmal vom PC kopieren (PowerShell, Server-IP einsetzen):

```powershell
scp Z:\workflow\daten\geschuetzt\*.json root@SERVER-IP:/var/lib/lernhelfer/geschuetzt/
```

Dann auf dem Server `sudo chown -R lernhelfer /var/lib/lernhelfer/geschuetzt`. Ohne die Dateien laufen Word-Power-Transkript und die vollen Werkzeuge nicht; die Lösungswege für alle anderen brauchen sie nicht.

Dann auf der Seite mit der Mail aus `LH_ADMIN` registrieren und bestätigen: Ganz unten in der Seitenleiste (am Handy unter „Konto“) erscheint „Admin-Ecke“. Sie fragt nach dem Passwort aus `LH_ECKE` und zeigt dann Dashboard, Zahlungen und die vollen Werkzeuge, 12 Stunden lang.

## Laufender Betrieb

- **Zahlung kommt rein:** Admin-Ecke → bei der Bestellung mit diesem Verwendungszweck „Geld ist da“. Der Tarif startet sofort, die Person bekommt eine Mail.
- **Update:** `cd /opt/lernhelfer && sudo git pull && sudo systemctl restart lernhelfer`
- **Sicherung** jede Nacht, sieben Tage rollierend (`sudo crontab -e`):
  `0 3 * * * sqlite3 /var/lib/lernhelfer/lernhelfer.db ".backup '/var/lib/lernhelfer/sicherung-$(date +\%u).db'"`
  Zusätzlich eine Kopie außerhalb des Servers: bei netcup im Server Control Panel regelmäßig einen Snapshot anlegen, bei Hetzner die Backups im Cloud-Panel einschalten (20 % des Serverpreises).
- **Recht:** `recht-vorlage.md` ausfüllen und als `/var/lib/lernhelfer/recht.md` speichern; die App zeigt sie unter „Impressum, Datenschutz und AGB“.
