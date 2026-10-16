Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub | ssh -o StrictHostKeyChecking=accept-new root@62.83.21.224 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && echo FERTIG"
