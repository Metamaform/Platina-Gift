# Установка зависимостей перед запуском:
# pip install aiohttp tqdm

import os
import gzip
import json
import asyncio
import aiohttp
from tqdm.asyncio import tqdm

# Настройки
OUTPUT_DIR = "./telegram_gifts_3d"
# Пример адреса коллекции подарков (Telegram Collectible Gifts).
# Если у коллекции другой адрес, замените его.
COLLECTION_ADDRESS = "EQCE80Aln8YfldnQLwWMvOfloLGgmPY0eGDJz9ufG3gRui3D" 
TONAPI_URL = f"https://tonapi.io/v2/nfts/collections/{COLLECTION_ADDRESS}/items"
IPFS_GATEWAY = "https://ipfs.io/ipfs/"

async def fetch_with_backoff(session, url, params=None, max_retries=5, response_type='json'):
    """Выполняет запрос с экспоненциальной задержкой при ошибке 429 (Rate Limit)."""
    retries = 0
    while retries < max_retries:
        try:
            async with session.get(url, params=params) as response:
                if response.status == 429:
                    wait_time = 2 ** retries
                    await asyncio.sleep(wait_time)
                    retries += 1
                    continue
                
                response.raise_for_status()
                
                if response_type == 'json':
                    return await response.json()
                else:
                    return await response.read()
        except aiohttp.ClientResponseError as e:
            if e.status == 429 and retries < max_retries:
                wait_time = 2 ** retries
                await asyncio.sleep(wait_time)
                retries += 1
                continue
            raise e
        except Exception as e:
            if retries < max_retries:
                wait_time = 2 ** retries
                await asyncio.sleep(wait_time)
                retries += 1
                continue
            raise e
            
    raise Exception(f"Превышено максимальное количество попыток для {url}")

def sanitize_filename(name):
    """Очищает имя файла от недопустимых символов."""
    return "".join([c for c in name if c.isalpha() or c.isdigit() or c == ' ']).rstrip().replace(" ", "_")

def normalize_url(url):
    """Преобразует IPFS ссылки в HTTP."""
    if url.startswith("ipfs://"):
        return url.replace("ipfs://", IPFS_GATEWAY)
    return url

async def download_and_process_file(session, url, item_name, item_id, pbar):
    """Скачивает файл и, если это .tgs, распаковывает его в .json."""
    url = normalize_url(url)
    
    # Определяем расширение
    ext = os.path.splitext(url.split('?')[0])[1].lower()
    if not ext:
        if 'lottie' in url or 'tgs' in url:
            ext = '.tgs'
        elif 'gltf' in url:
            ext = '.gltf'
        elif 'glb' in url:
            ext = '.glb'
        else:
            ext = '.json'

    filename = f"{item_name}_{item_id}{ext}"
    filepath = os.path.join(OUTPUT_DIR, filename)

    try:
        content = await fetch_with_backoff(session, url, response_type='bytes')

        if ext == '.tgs':
            # Распаковка .tgs (gzip) -> .json (Lottie)
            try:
                uncompressed_data = gzip.decompress(content)
                json_filename = f"{item_name}_{item_id}_lottie.json"
                json_filepath = os.path.join(OUTPUT_DIR, json_filename)
                
                with open(json_filepath, 'wb') as f:
                    f.write(uncompressed_data)
            except Exception:
                # Если файл не сжат (например, уже JSON, но с расширением tgs), сохраняем как есть
                with open(filepath, 'wb') as f:
                    f.write(content)
        else:
            # Сохраняем .gltf, .glb, .json как есть
            with open(filepath, 'wb') as f:
                f.write(content)
                
    except Exception as e:
        print(f"\nОшибка при скачивании {url}: {e}")
    finally:
        pbar.update(1)

async def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    async with aiohttp.ClientSession() as session:
        print("Получение списка NFT из коллекции...")
        
        limit = 1000
        offset = 0
        all_items = []
        
        # Пагинация для получения всех элементов коллекции
        while True:
            params = {'limit': limit, 'offset': offset}
            try:
                data = await fetch_with_backoff(session, TONAPI_URL, params=params)
                items = data.get('nft_items', [])
                if not items:
                    break
                all_items.extend(items)
                offset += limit
            except Exception as e:
                print(f"Ошибка при получении списка: {e}")
                break

        print(f"Найдено подарков: {len(all_items)}")
        
        tasks = []
        # Собираем ссылки на 3D/векторные ассеты
        for item in all_items:
            metadata = item.get('metadata', {})
            name = sanitize_filename(metadata.get('name', f"gift_{item.get('index', 'unknown')}"))
            item_id = item.get('index', 'unknown')
            
            urls = set()
            # Проверяем нужные поля
            for key in ['image', 'animation_url', 'lottie_url', 'gltf_url', 'vector_url']:
                if key in metadata and metadata[key]:
                    url = metadata[key]
                    if any(x in url.lower() for x in ['.tgs', '.json', '.gltf', '.glb', 'lottie']):
                        urls.add(url)
            
            # Проверяем внутри attributes
            attributes = metadata.get('attributes', [])
            if isinstance(attributes, list):
                for attr in attributes:
                    val = attr.get('value', '')
                    if isinstance(val, str) and val.startswith('http'):
                        if any(val.lower().endswith(ext) for ext in ['.tgs', '.json', '.gltf', '.glb']):
                            urls.add(val)
                            
            # Создаем задачи на скачивание
            for url in urls:
                tasks.append((url, name, item_id))

        if not tasks:
            print("Ссылки на модели и анимации не найдены.")
            return

        print(f"Найдено файлов для скачивания: {len(tasks)}")
        
        # Скачиваем файлы параллельно с прогресс-баром
        pbar = tqdm(total=len(tasks), desc="Скачивание и распаковка")
        
        # Ограничиваем количество одновременных подключений (чтобы не перегрузить сеть/память)
        semaphore = asyncio.Semaphore(20)
        
        async def sem_task(url, name, item_id):
            async with semaphore:
                await download_and_process_file(session, url, name, item_id, pbar)
                
        await asyncio.gather(*(sem_task(url, name, item_id) for url, name, item_id in tasks))
        pbar.close()
        
        print(f"\nГотово! Все файлы сохранены в папку {OUTPUT_DIR}")

if __name__ == "__main__":
    asyncio.run(main())
