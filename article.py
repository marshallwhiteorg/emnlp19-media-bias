''' Represents a news article '''


import json
import constants
import os
from datetime import datetime
import io


class Article():
    mainEntities = []
    mainEvent = ''
    title = ''
    bodyParagraphs = []
    tripletUuid = ''
    uuid = ''
    filepath = ''
    date = ''
    source = ''
    url = ''

    def __init__(self, filepath):
        ''' Load from filepath '''
        self.initFromFilePath(filepath)


    def initFromFilePath(self, filepath):
        article = json.load(io.open(filepath, encoding='utf-8'))
        self.filepath = filepath
        self.filenameWithExtension = os.path.basename(self.filepath)
        self.filenameWithoutExtension, _ = os.path.splitext(self.filenameWithExtension)
        self.mainEntities = article[constants.MAIN_ENTITIES]
        self.mainEvent = article[constants.MAIN_EVENT]
        self.title = article[constants.TITLE]
        self.bodyParagraphs = article[constants.BODY_PARAGRAPHS]
        self.uuid = article[constants.UUID]
        self.tripletUuid = article[constants.TRIPLET_UUID]
        self.date = datetime.strptime(article[constants.DATE], '%Y-%m-%d')
        self.source = article[constants.SOURCE]
        self.url = article[constants.URL]
