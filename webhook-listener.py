#!/usr/bin/env python3

"""
OnliOps Webhook Listener
Escuta webhooks do GitHub e executa auto-deploy
"""

import http.server
import socketserver
import json
import hmac
import hashlib
import subprocess
import os
from datetime import datetime

# Configuração
PORT = 9001
SECRET = os.getenv('WEBHOOK_SECRET', 'onliops-webhook-secret-2024').encode()
DEPLOY_SCRIPT = '/home/alfreire/docker/apps/onliops/auto-deploy.sh'

def log(message):
    """Log com timestamp"""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f"[{timestamp}] {message}", flush=True)

def verify_signature(payload, signature):
    """Verifica assinatura do GitHub"""
    if not signature:
        return False
    
    expected = 'sha256=' + hmac.new(SECRET, payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(signature, expected)

def execute_deploy():
    """Executa o script de deploy"""
    log("🚀 Executando deploy...")
    
    try:
        result = subprocess.run(
            ['bash', DEPLOY_SCRIPT],
            capture_output=True,
            text=True,
            timeout=600  # 10 minutos timeout
        )
        
        log("📋 Deploy output:")
        if result.stdout:
            print(result.stdout)
        
        if result.stderr:
            log("⚠️  Warnings:")
            print(result.stderr)
        
        if result.returncode == 0:
            log("✅ Deploy concluído com sucesso")
        else:
            log(f"❌ Deploy falhou com código: {result.returncode}")
            
    except subprocess.TimeoutExpired:
        log("❌ Deploy timeout (>10 minutos)")
    except Exception as e:
        log(f"❌ Erro no deploy: {e}")

class WebhookHandler(http.server.BaseHTTPRequestHandler):
    """Handler para requisições webhook"""
    
    def log_message(self, format, *args):
        """Override para usar nosso log"""
        pass
    
    def do_POST(self):
        """Handle POST requests"""
        if self.path != '/webhook':
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b'Not Found')
            return
        
        # Ler body
        content_length = int(self.headers['Content-Length'])
        body = self.rfile.read(content_length)
        
        # Verificar assinatura
        signature = self.headers.get('X-Hub-Signature-256', '')
        
        if not verify_signature(body, signature):
            log("❌ Assinatura inválida")
            self.send_response(401)
            self.end_headers()
            self.wfile.write(b'Unauthorized')
            return
        
        # Parse payload
        try:
            payload = json.loads(body)
            event = self.headers.get('X-GitHub-Event', '')
            
            if event == 'push':
                branch = payload.get('ref', '').split('/')[-1]
                pusher = payload.get('pusher', {}).get('name', 'unknown')
                commits = len(payload.get('commits', []))
                
                log(f"📥 Push recebido na branch: {branch}")
                log(f"👤 Por: {pusher}")
                log(f"📝 Commits: {commits}")
                
                # Apenas deploy na main
                if branch == 'main':
                    execute_deploy()
                    self.send_response(200)
                    self.end_headers()
                    self.wfile.write(b'Deploy iniciado')
                else:
                    log(f"⏭️  Ignorando push em branch {branch}")
                    self.send_response(200)
                    self.end_headers()
                    self.wfile.write(b'Branch ignorada')
            else:
                log(f"⏭️  Evento ignorado: {event}")
                self.send_response(200)
                self.end_headers()
                self.wfile.write(b'Evento ignorado')
                
        except Exception as e:
            log(f"❌ Erro ao processar payload: {e}")
            self.send_response(400)
            self.end_headers()
            self.wfile.write(b'Bad Request')
    
    def do_GET(self):
        """Handle GET requests (health check)"""
        if self.path == '/health':
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b'OK')
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b'Not Found')

if __name__ == '__main__':
    with socketserver.TCPServer(("", PORT), WebhookHandler) as httpd:
        log(f"🎧 Webhook listener rodando na porta {PORT}")
        log(f"🔐 Secret configurado")
        log(f"📂 Deploy script: {DEPLOY_SCRIPT}")
        log(f"🌐 URL: http://65.109.14.53:{PORT}/webhook")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            log("👋 Encerrando webhook listener...")
            httpd.shutdown()
