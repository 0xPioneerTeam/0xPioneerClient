import json
import os
import shutil


# 根据后缀获取文件
def searchFiles(path, suffix):
    result = []
    files = os.listdir(path)
    for file in files:
        filePath = str(path + "/" + file)
        if os.path.isfile(filePath):
            if filePath.endswith(suffix):
                result.append(filePath)
        elif os.path.isdir(filePath):
            result += searchFiles(filePath, suffix)
    return result


# 获取prefab中引用的图片
def searchSpriteFromPrefab(prefabPath):
    result = []
    prefabValue = json.load(open(prefabPath, "r"))
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


# 根据路径获取module名称
def analyseModuleName(path):
    if "Module" in path:
        return (path.split("Module")[0] + "Module" + "/".join(path.split("Module")[-1].split("/")[0:3])).replace("/_Atlas", "")
    if "resources" in path:
        return path.split("resources")[0] + "Module" + "/".join(path.split("resources")[-1].split("/")[0:3])
    return None


# 根据要移动的module和原始路径构造新路径
def processPath(modulePath, filePath):
    dstPath = modulePath + "/_Atlas"
    currentPath = analyseModuleName(filePath)
    paths = filePath.replace(currentPath, "").split("/")
    if len(paths) > 1 and paths[-2] != "_Atlas" and paths[-2] != "Atlas" and paths[-2] != "Internal" and paths[-2] != "":
        dstPath += "/" + paths[-2]
    if len(paths) > 0:
        dstPath += "/" + paths[-1]
    return dstPath


# 移动文件
def moveFile(src, dst):
    if not os.path.exists(src):
        return
    if src == dst:
        return

    paths = dst.split("/")
    currentPath = "."
    while len(paths) > 1:
        currentPath += "/" + paths.pop(0)
        if not os.path.exists(currentPath):
            os.mkdir(currentPath)
    dst = "/".join(dst.split("/")[:-1])
    shutil.move(src, dst)
    if os.path.exists(src + ".meta"):
        shutil.move(src + ".meta", dst)


# 删除空文件夹
def deleteEmptyDir(path):
    files = os.listdir(path)
    if len(files) == 0:
        os.rmdir(path)
        return True

    isEmpty = True
    for file in files:
        filePath = str(path + "/" + file)
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
    projectPath = "../cocos_client/assets"

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
            rawUuid = ""
            for key in imageJson["subMetas"]:
                uuid = imageJson["subMetas"][key]["uuid"]
            if uuid != "":
                imageMap[uuid] = image

    # 收集所有prefab引用的素材信息
    prefabs = searchFiles(projectPath, ".prefab") + searchFiles(projectPath, ".anim")
    refMap = {}
    print("all prefabs:", prefabs)
    return
    for prefab in prefabs:
        refSprites = searchSpriteFromPrefab(prefab)

        moduleName = analyseModuleName(prefab)
        if moduleName is None:
            continue
        for refSprite in refSprites:
            realUuid = refSprite
            if realUuid in rawUuidMap:
                realUuid = rawUuidMap[realUuid]

            if realUuid not in refMap:
                refMap[realUuid] = []
            if moduleName not in refMap[realUuid]:
                refMap[realUuid].append(moduleName)

    # 根据图片出现次数调整
    for uuid in imageMap:
        # 判定是不是spine图片，spine不要处理
        imageURL = imageMap[uuid]
        if os.path.exists(imageURL.replace("." + imageURL.split(".")[-1], ".json")):
            continue
        if uuid not in refMap:
            # 需要删除
            os.remove(imageMap[uuid])
        else:
            if len(refMap[uuid]) == 1:
                # 只有1处引用
                currentModule = analyseModuleName(refMap[uuid][0])
                dstPath = processPath(currentModule, imageMap[uuid])
                moveFile(imageMap[uuid], dstPath)
            else:
                isSameModule = True
                isSameGroup = True
                lastModuleName = ""
                lastGroupName = ""
                for item in refMap[uuid]:
                    temps = item.split("/")
                    moduleName = temps[-2]
                    groupName = temps[-1]
                    if lastModuleName != "" and moduleName != lastModuleName:
                        isSameModule = False
                        isSameGroup = False
                        break
                    if lastGroupName != "" and groupName != lastGroupName:
                        isSameGroup = False
                    lastModuleName = moduleName
                    lastGroupName = groupName
                if isSameModule:
                    if isSameGroup:
                        # 相同组，移动到同组的_Atlas下
                        currentModule = analyseModuleName(refMap[uuid][0])
                        dstPath = processPath(currentModule, imageMap[uuid])
                        moveFile(imageMap[uuid], dstPath)
                    else:
                        # 不同组相同模块，移动到模块下的_Atlas
                        dstPath = processPath("../client/assets/Module/" + lastModuleName, imageMap[uuid])
                        moveFile(imageMap[uuid], dstPath)
                else:
                    dstPath = processPath("../client/assets/Module/_Global", imageMap[uuid])
                    moveFile(imageMap[uuid], dstPath)

    # 清空空文件夹
    deleteEmptyDir(projectPath)

    # 添加图集文件
    addPacFile(projectPath)


if __name__ == "__main__":
    mainLogic()