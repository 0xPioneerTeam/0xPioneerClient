import json
import os
import shutil


# 根据后缀获取文件
def searchFiles(path, suffix):
    result = []
    files = os.listdir(path)
    for file in files:
        filePath = str(path + "\\" + file)
        if os.path.isfile(filePath):
            if filePath.endswith(suffix):
                result.append(filePath)
        elif os.path.isdir(filePath):
            result += searchFiles(filePath, suffix)
    return result


# 获取prefab中引用的图片
def searchSpriteFromPrefab(prefabPath):
    result = []
    prefabValue = json.load(open(prefabPath, "r", encoding="utf-8"))
    stacks = [prefabValue]
    while len(stacks) > 0:
        item = stacks.pop(0)
        if isinstance(item, dict):
            for key in item:
                if key == "__uuid__":
                    result.append(item[key])
                else:
                    stacks.append(item[key])
        elif isinstance(item, list):
            stacks += item
    return result




# 移动文件
def moveFile(src, dst):
    target_file = os.path.join(dst, os.path.basename(src))
    if os.path.exists(target_file):
        print("move dst exists")
        return
    if not os.path.exists(src):
        print("move src not exists")
        return
    if src == dst:
        print("move src == dst")
        return

    if not os.path.exists(dst):
        os.makedirs(dst)
        
    shutil.move(src, dst, copy_function=shutil.copy2)
    if os.path.exists(src + ".meta"):
        shutil.move(src + ".meta", dst, copy_function=shutil.copy2)


# 删除空文件夹
def deleteEmptyDir(path):
    files = os.listdir(path)
    if len(files) == 0:
        os.rmdir(path)
        return True

    isEmpty = True
    for file in files:
        filePath = str(path + "\\" + file)
        if os.path.isdir(filePath):
            nextIsEmpty = deleteEmptyDir(filePath)
            if not nextIsEmpty:
                isEmpty = False
        else:
            if filePath.endswith(".pac") or filePath.endswith(".meta") or filePath.endswith(".DS_Store"):
                pass
            else:
                isEmpty = False

    if isEmpty:
        shutil.rmtree(path)
    return isEmpty


# 添加合图文件
def addPacFile(path):
    files = os.listdir(path)
    if path.endswith("/_Atlas"):
        existsPac = False
        for file in files:
            if file.endswith(".pac"):
                existsPac = True
                break

        if not existsPac:
            pacFile = '''
                {
                    "__type__": "cc.SpriteAtlas"
                }
                '''
            open(path + "/_AutoAtlas.pac", "w").write(pacFile)
    else:
        for file in files:
            filePath = str(path + "/" + file)
            if os.path.isdir(filePath):
                addPacFile(filePath)


def mainLogic():
    projectPath = "..\\cocos_client\\assets"

    # 收集所有图片信息
    imageMap = {}
    images = searchFiles(projectPath, ".jpeg") \
             + searchFiles(projectPath, ".jpg") \
             + searchFiles(projectPath, ".png")
    for image in images:
        metaImage = image + ".meta"
        if os.path.exists(metaImage):
            imageJson = json.load(open(metaImage, "r"))
            uuid = ""
            for key in imageJson["subMetas"]:
                uuid = imageJson["subMetas"][key]["uuid"]
            if uuid != "":
                imageMap[uuid] = image

    # 收集所有prefab引用的素材信息
    prefabs = searchFiles(projectPath, ".prefab") + searchFiles(projectPath, ".anim")
    refMap = {}

    current_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.dirname(current_dir)
    assets_dir = os.path.join(root_dir, "cocos_client\\assets")
    new_image_dir = os.path.join(assets_dir, "new_images")

    for prefab in prefabs:
        refSprites = searchSpriteFromPrefab(prefab)
        ######## 处理目录
        start = prefab.find('assets\\') + len('assets\\')  # start = 19
        # 找到最后一个 '/' 的位置并计算 end 索引
        end = prefab.rfind('.')  # end = 60
        # 提取子字符串
        extracted_path = prefab[start:end]
        
        for refSprite in refSprites:
            if refSprite not in refMap:
                refMap[refSprite] = []
                
            exsit = False    
            for path in refMap[refSprite]:
                if path == extracted_path:
                    exsit = True
                    break

            if not exsit:
                refMap[refSprite].append(extracted_path)
        
                  
    for uuid in imageMap: 
        imageURL = imageMap[uuid]
        
        if "abresources\\icon" in imageURL or "tiled_map\\t1" in imageURL:
            continue
        if os.path.exists(imageURL.replace("." + imageURL.split(".")[-1], ".json")):
            continue
        if uuid not in refMap:
            os.remove(imageURL)
        else:
            if len(refMap[uuid]) == 1:
                # 只有1处引用
                moveFile(imageURL, os.path.join(new_image_dir, refMap[uuid][0]))
            if len(refMap[uuid]) > 1:
                result_path = ""
                for path in refMap[uuid]:
                    result_path = result_path + "&" + path.split('\\')[-1]
                    
                if len(result_path) > 50:
                    result_path = result_path[:50]
            
                moveFile(imageURL, os.path.join(new_image_dir, "common\\" + result_path))
    
    # 清空空文件夹
    deleteEmptyDir(projectPath)

    # 添加图集文件
    # addPacFile(projectPath)


if __name__ == "__main__":
    mainLogic()