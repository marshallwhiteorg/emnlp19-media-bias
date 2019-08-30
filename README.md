## About

This repository holds the data and code for the EMNLP 2019 paper "In Plain Sight: Media Bias Through the Lens of Factual Reporting".

## Citation and link
[In Plain Sight: Media Bias Through the Lens of Factual Reporting](arxiv-link)

@inproceedings{mediabias2019,
    title = "In Plain Sight: Media Bias Through the Lens of Factual Reporting",
    author = "Fan, Lisa  and
      White, Marshall  and
      Sharma, Eva  and
      Su, Ruisi  and
      Choubey, Prafulla Kumar  and
      Huang, Ruihong  and
      Wang, Lu",
    booktitle = "Proceedings of the 2019 Conference on Empirical Methods in Natural Language Processing",
    year = "2019",
    publisher = "Association for Computational Linguistics"
}



## Contents
- data/articles/: original news articles  
- data/annotations/: gold-standard annotations  
- data/html/: generated html to be used for annotating articles  
- annotate.js: logic for annotation tool  
- annotation.css: styling for annotation tool  
- create_html.py: script converting an article in json format to an html file for the tool  
- create_html_utils.py: utils for create_html.py  
- article.py: model for a news article  
- constants.py: constants to help load articles  


## Annotation tool usage
- Open a generated html file in your browser to annotate it.  
- Select words and phrases by highlighting them.  
- Select the entire sentence using the “S” button at the end of each sentence.  
- The first 5 questions (“target”, “polarity”, “aim”, “bias type”, “quote”) are mandatory.  
- The “speaker” question is mandatory and only used if the bias is part of a quote.  
- The “indirect target” and “sentiment towards indirect target” questions are mandatory and are only used if the bias is indirect.  
- You can edit or delete annotations by clicking the highlighted spans, or by clicking the “S” button again.  
- You will lose all progress if you exit the page.  
- When you are done with the entire article, click “Download annotation file” to save the annotations locally. Please keep track of these files manually.  
- You can resume working on an article by importing a previously created annotation file.  
- In order to annotate overlapping spans, select the “S” button for the sentence and then use the “Duplicate” button to make a copy. You can duplicate sentences as many times as you want in order to capture overlapping spans.  


## Annotation file creation
To create your own html file that can be used to annotate {article-name}:
```
python create_html.py data/articles/{article-year}/{article-name}.json
```
The generated html file will only work if it's nested 3 directories deep, which is where create_html.py will put it by default.  


## Annotation protocol
A protocol for annotating the articles is located [here](https://github.com/lisafan/emnlp19-BASIL/blob/master/annotation-protocol.pdf).


## Other notes
- May not work with IE
- The "S" button next to each line allows annotation of the entire sentence
- Only allows selection of full words
- Only allows selection from within one sentence (can't span multiple lines)

## Contact 

For support or questions, please contact Lisa Fan (lisafan38@gmail.com) or Marshall White (marshall@marshallwhite.org).
