from Utility import Utility

class Folder():

    def __init__(self, path, utility):

        self.folderPath = path
        self.folderName = path.split("/")[-1]
        self.util = utility