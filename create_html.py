''' Create html files for use by the annotation tool.
Usage: python create_html.py relative/path/to/article/json
Saves html file in data/html/{article-publish-year}/{article-filename}.json
Accepts any number of input files
'''


import sys
import os
import re
import glob
import create_html_utils
from article import Article


def create(filepath):
    article = Article(filepath)
    document = create_html_utils.generate(article)
    root = 'data/html/{}'.format(str(article.date.year))
    if not os.path.exists(root):
        os.makedirs(root)
    with open(os.path.join(root, article.filenameWithoutExtension + '.html'),'w') as f:
        f.write(document)

if __name__ == '__main__':
    files = sys.argv[1:]
    for f in files:
        print(f)
        create(f)
