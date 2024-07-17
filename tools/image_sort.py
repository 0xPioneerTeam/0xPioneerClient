import json
import os
import shutil


def create_directory(directory_path):
    try:
        os.makedirs(directory_path)
        print(f"Directory created successfully: {directory_path}")
    except FileExistsError:
        print(f"Directory already exists: {directory_path}")

def find_files(path, suffixs):
    meta_paths = []
    for root, dirs, files in os.walk(path):
        for file in files:
            for suffix in suffixs:
                if file.endswith(suffix):
                    meta_paths.append(os.path.join(root, file))
                    break
    return meta_paths


def read_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)
            return data
    except UnicodeDecodeError as e:
        print(f"UnicodeDecodeError: {e}")
        return None
    except FileNotFoundError:
        print(f"File not found: {file_path}")
        return None

def find_anim_uuids(obj):
    uuids = []
    if isinstance(obj, dict):
        if obj.get("__expectedType__") == "cc.SpriteFrame":
            uuids.append(obj.get("__uuid__"))
        for key, value in obj.items():
            if isinstance(value, (dict, list)):
                uuids.extend(find_anim_uuids(value))
    elif isinstance(obj, list):
        for item in obj:
            uuids.extend(find_anim_uuids(item))
    return uuids

def get_image_resources_from_prefab(prefab_file_path):
    with open(prefab_file_path, 'r') as file:
        prefab_data = json.load(file)
    image_resources = []
    if 'subMetas' in prefab_data:
        for subMeta in prefab_data['subMetas'].values():
            if subMeta['type'] == 'texture':
                image_resources.append(subMeta['uuid'])
    return image_resources

def move_image_to_dir(sprite_frame_uuids, path):
    current_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.dirname(current_dir)
    assets_dir = os.path.join(root_dir, "cocos_client\\assets")

    image_meta_file_path = find_files(assets_dir, [".png.meta", ".jpg.meta"])

    target_dir = os.path.splitext(path)[0]
    target_dir = target_dir.split('assets\\', 1)[-1]
    newImage_dir = os.path.join(assets_dir, "newImage\\" + target_dir)
    create_directory(newImage_dir)

    for sprite_frame_uuid in sprite_frame_uuids:
        if "@" in sprite_frame_uuid: 
            sprite_frame_uuid = sprite_frame_uuid.split("@")[0]
            # print("uuid:", sprite_frame_uuid)

        for meta_file_path in image_meta_file_path:
            image_meta_data = read_file(meta_file_path)
            if isinstance(image_meta_data, dict):
                if image_meta_data.get("uuid") == sprite_frame_uuid:
                    print("image_meta_file:", meta_file_path)
                    if meta_file_path.endswith('.meta'):
                            file_path_without_meta = meta_file_path[:-5]  # 去除末尾的 '.meta'，长度为 5
                            print("filep:", file_path_without_meta)
                            meta_file_basename = os.path.basename(meta_file_path)
                            file_basename = os.path.basename(file_path_without_meta)

                            new_meta_file_path = os.path.join(newImage_dir, meta_file_basename)
                            if os.path.exists(new_meta_file_path):
                                print("File already exists:", new_meta_file_path)
                            else:
                                shutil.move(meta_file_path, new_meta_file_path)

                            new_file_path = os.path.join(newImage_dir, file_basename)
                            if os.path.exists(new_file_path):
                                print("File already exists:", new_file_path)
                            else:
                                shutil.move(file_path_without_meta, new_file_path)
                    else:
                        print("File path does not end with '.meta'")
                    # image_uuids = [sprite_frame_uuid]
                    # copy_images_to_directory(image_uuids, assets_dir, assets_dir)
                    break


def remove_empty_directories(directory):
    # 遍历目录树
    for dirpath, dirnames, filenames in os.walk(directory, topdown=False):
        # 检查是否是空目录
        if not dirnames and not filenames:
            # 如果是空目录，则删除
            os.rmdir(dirpath)
            print(f"Removed empty directory: {dirpath}")



def main():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.dirname(current_dir)
    assets_dir = os.path.join(root_dir, "cocos_client\\assets")
    # 找到所有prefab的文件
    prefab_file_path = find_files(assets_dir, [".prefab"])
    # 找到所有anim的文件
    anim_file_path = find_files(assets_dir, [".anim"])

    #遍历所有的prefab文件
    for idx, path in enumerate(prefab_file_path):
        prefab_data = read_file(path)
        # image_uuids = get_image_resources_from_prefab(meta_data)
        sprite_frame_uuids = find_anim_uuids(prefab_data)
        move_image_to_dir(sprite_frame_uuids, path)


    for idx, path in enumerate(anim_file_path): 
        anim_data = read_file(path)
        uuids = find_anim_uuids(anim_data)
        move_image_to_dir(uuids, path)

    remove_empty_directories(assets_dir)


main()