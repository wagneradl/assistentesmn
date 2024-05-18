import re
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from openai import OpenAI
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente do arquivo .env
load_dotenv()

app = Flask(__name__, static_folder="../frontend")
CORS(app, resources={r"/*": {"origins": "*"}})

# Obter a chave da API do OpenAI a partir das variáveis de ambiente
api_key = os.getenv('OPENAI_API_KEY')
if not api_key:
    raise ValueError("API Key não encontrada no arquivo .env")

client = OpenAI(api_key=api_key)

# ID do Assistant criado
ASSISTANT_ID = "asst_GMDQKxYlCiUhHbtNU4X2D0pO"

@app.route('/')
def serve_frontend():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static_files(path):
    return send_from_directory(app.static_folder, path)

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get('message')
    if not user_message:
        return jsonify({'error': 'Nenhuma mensagem fornecida'}), 400

    try:
        # Criar um novo thread com a mensagem do usuário
        print("Criando thread com a mensagem do usuário...")
        thread = client.beta.threads.create(
            messages=[{"role": "user", "content": user_message}]
        )
        print(f"Thread criada com ID: {thread.id}")

        # Criar e executar o run
        print("Criando e executando o run...")
        run = client.beta.threads.runs.create_and_poll(
            thread_id=thread.id, assistant_id=ASSISTANT_ID
        )
        print(f"Run criado com ID: {run.id}")

        # Obter e retornar a mensagem do assistant
        print("Obtendo a mensagem do assistant...")
        messages = list(client.beta.threads.messages.list(thread_id=thread.id, run_id=run.id))

        # Extrair o texto da resposta concatenando todos os blocos
        raw_message = "".join(str(block.text) for block in messages[0].content if hasattr(block, 'text'))

        # Remover anotações e metadados usando expressões regulares
        message_text = re.sub(r'Text\(annotations=\[.*?\], value=\'|\'$', '', raw_message)
        message_text = re.sub(r'【\d+:\d+†source】', '', message_text)
        
        # Remover quebras de linha duplas e caracteres indesejados no final
        message_text = message_text.replace('\\n\\n', '\n')
        message_text = message_text.rstrip(')\'')

        print(f"Mensagem recebida do assistant: {message_text}")
        return jsonify({'response': message_text})
    except Exception as e:
        print(f"Erro ao processar a solicitação: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True)