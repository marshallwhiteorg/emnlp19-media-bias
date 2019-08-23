'''
Utils for generating html for annotation tool
'''


import re


def underscoredEntity(ent):
    return ent.replace(' ', '_')

def makeEntityQuestions(entities):
    questions = []
    for idx, ent in enumerate(entities):
        question = '''
            <div class="article-question-div">
            <h3>Main Entity: {ent_display}</h3>
            <h4>How do you think the author feels regarding this main entity?</h4>
            <label><input type="radio" name="author_feeling_{ent}" value="pos"> Positive</label><br>
            <label><input type="radio" name="author_feeling_{ent}" value="neu"> Neutral</label><br>
            <label><input type="radio" name="author_feeling_{ent}" value="neg"> Negative</label><br>
            </div>
            <div class="article-question-div">
            <h4>How did you feel about this main entity prior to reading the article?</h4>
            <label><input type="radio" name="you_feeling_{ent}" value="str-pos"> Strongly positive</label><br>
            <label><input type="radio" name="you_feeling_{ent}" value="sli-pos"> Slightly positive</label><br>
            <label><input type="radio" name="you_feeling_{ent}" value="neu"> Neutral</label><br>
            <label><input type="radio" name="you_feeling_{ent}" value="sli-neg"> Slightly negative</label><br>
            <label><input type="radio" name="you_feeling_{ent}" value="str-neg"> Strongly negative</label><br>
            </div>
            '''
        questions.append(question.format(ent_display=ent, ent=underscoredEntity(ent), idx=idx))
    return questions


def makeArticleLevelForm(mainEvent, entities, includeSubmit=True):
    if includeSubmit:
        submitButton = '<button type="button" class="btn submit" id="submit" onclick="submitArticleLevelForm()">Submit</button>'
    else:
        submitButton = ''
    baseForm = '''
        <div class="form-popup" id="article-level-form-div">
        <form class="form-container" id="article-level-form">
        <div class="article-question-div">
        <h3>Main Event: {mainEvent}</h3>
        <h4>How do you think the author feels regarding the main event?</h4>
        <label><input type="radio" name="author_feeling_main_event" value="pos"> Positive</label><br>
        <label><input type="radio" name="author_feeling_main_event" value="neu"> Neutral</label><br>
        <label><input type="radio" name="author_feeling_main_event" value="neg"> Negative</label><br>
        </div>
        {entityQuestions}
        <h3>Political Stance</h3>
        <h4 style="margin-bottom:0px">Is this article more left, center, or more right compared to the other articles in the triple?</h4>

        <font size="2">Note: Within a triplet, one should be labeled "More left", one should be labeled "Center", and the other should be labeled "More right".</font><br><br>
        <label><input type="radio" name="relative_stance" value="left"> More left</label><br>
        <label><input type="radio" name="relative_stance" value="center"> Center</label><br>
        <label><input type="radio" name="relative_stance" value="right"> More right</label><br>
        <h3> Additional Notes</h3>
        <textarea name="notes" id="article-level-notes"></textarea><br>
        <div id="article-level-form-error-msg"></div>
        {submitButton}
        <button type="button" class="btn cancel" onclick="closeArticleLevelForm()">Cancel</button>
        </form>
        </div>
    '''
    entityQuestions = makeEntityQuestions(entities)
    return baseForm.format(mainEvent=mainEvent,
                           entityQuestions=''.join(entityQuestions),
                           submitButton=submitButton)

def headForAnnotation(filenameWithoutExtension, tripletUuid, uuid, title):
    return '''
        <head>
            <meta charset=UTF-8>
        	<link rel = "stylesheet" type = "text/css" href = "../../../annotation.css">
        	<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"></script>
        	<script src="../../../annotate.js"></script>
        	<script type="text/javascript">
        		var file_id="{filenameWithoutExtension}";
                var tripletUuid="{tripletUuid}";
                var uuid="{uuid}";
        	</script>
        </head>
        <body onload="init()">
        <i>Title: {title}</i><br><br>
        '''.format(filenameWithoutExtension=filenameWithoutExtension, tripletUuid=tripletUuid, uuid=uuid, title=title)

def articleLevelButton():
    return '<button type="button" class="btn" id="article-level-button" onclick="showArticleLevelForm()">Article-level annotation</button><br>'

def makeArticleHTML(paragraphs):
    lines = [line for paragraph in paragraphs for line in paragraph]
    html = '<div id="article" onmouseup="annotate()">'
    for idx, line in enumerate(lines):
        html += '<span class="para" id="p%d">%s</span>\t<button class="sent" id="p%d">S</button><br><br>\n\n'%(idx,line.strip(),idx)
    return html + "</div>"


# generate the buttons for the form
# submit, cancel, delete buttons or just cancel
def generateButtons(includeSubmitDelete):
    submitButton = '<button type="button" class="btn submit" id="submit">Submit</button>'
    cancelButton = '<button type="button" class="btn cancel" onclick="closeForm()">Cancel</button>'
    deleteButton = '<button type="button" class="btn delete" id="delete">Delete</button>'
    duplicateButton = '<button type="button" class="btn duplicate" id="duplicate">Duplicate</button>'

    if includeSubmitDelete:
        return submitButton + '\n' + cancelButton + '\n' + deleteButton + '\n' + duplicateButton
    else:
        return cancelButton


def makePhraseLevelForm(entities, includeSubmitDelete=True):
    buttons = generateButtons(includeSubmitDelete)
    form = '''
	    <div class="form-popup" id="myForm">
	    <form class="form-container" id="form_data">
	    	<h2 id="selected_text"></h2>
	        <h3>Main Target</h3>
	    '''
    if len(entities) == 1:
	    form += '   <label><input type="radio" name="target" value="%s" checked> %s</label><br>\n'%(underscoredEntity(entities[0]), entities[0])
    else:
	    for e in entities:
	        form += '	<label><input type="radio" name="target" value="%s"> %s</label><br>\n'%(underscoredEntity(e), e)

    form += '''
    	<h3>Polarity</h3>
    	<label><input type="radio" name="polarity" value="pos"> Positive</label><br>
    	<label><input type="radio" name="polarity" value="neg"> Negative</label><br>

    	<h3>Aim</h3>
    	<label><input type="radio" name="aim" value="dir" onclick="hideIndirectTargetSentiment()"> Direct</label><br>
    	<label><input type="radio" name="aim" value="ind_pro" onclick="showIndirectTargetSentiment()"> Indirect (Ally)</label><br>
    	<label><input type="radio" name="aim" value="ind_anti" onclick="showIndirectTargetSentiment()"> Indirect (Opponent)</label><br>
        <label><input type="radio" name="aim" value="ind_general" onclick="showIndirectTargetSentiment()"> Indirect (General)</label><br>

        <div id="indirect-target-name">
    	<h3>Indirect Target:
        <label><input type="text" name="indirect-target-name" id="indirect-target-name-label"></label></h3>
        </div>

        <div id="indirect-ally-opponent-sentiment">
        <h3>Sentiment Towards Indirect Target</h3>
        <label><input type="radio" name="indirect-ally-opponent-sentiment" value="pos"> Positive</label><br>
        <label><input type="radio" name="indirect-ally-opponent-sentiment" value="neu"> Neutral</label><br>
        <label><input type="radio" name="indirect-ally-opponent-sentiment" value="neg"> Negative</label><br>
        </div>

    	<h3>Bias Type</h3>
    	<label><input type="radio" name="bias" value="lex"> Lexical</label><br>
    	<label><input type="radio" name="bias" value="inf"> Informational</label><br>

    	<h3>Is the bias in a quote?</h3>
    	<label><input type="radio" name="quote" value="yes" onclick="show_speaker()"> Yes</label><br>
    	<label><input type="radio" name="quote" value="no" onclick="hide_speaker()" checked> No</label><br>

    	<div id="speaker" style="display:none">
    	<h3>If yes, who said the quote?</h3>
    '''
    for e in entities:
    	form += '	<label><input type="radio" name="speaker" value="%s"> %s</label><br>\n'%(underscoredEntity(e), e)

    form +='''	<label><input type="radio" name="speaker" value="other_pro"> Other (Pro-target)</label><br>
    	<label><input type="radio" name="speaker" value="other_anti"> Other (Anti-target)</label><br>
    	<label><input type="radio" name="speaker" value="other_neutral"> Other (Neutral)</label><br>
    	</div>

    	<h3> Additional Notes</h3>
    	<textarea id="notes"></textarea><br>

    	<div id="error_msg"></div>
        {buttons}
    </form>
    </div>
    '''
    return form.format(buttons=buttons)

# returns footer including download and import buttons
def makeFooter():
    return '''
        <button type="button" class="btn" onclick="download_annotations()">Download annotation file</button>
        <button id="imp_btn" onclick="document.getElementById('import').click();">Import existing annotation file</button>
        <input type="file" id="import" style="display:none" onchange="importFile(this.files)">
        <div id="import_error"></div>
        '''


def createDocument(sections):
    return ''.join(sections)

def generate(article):
    return createDocument([headForAnnotation(article.filenameWithoutExtension, article.tripletUuid, article.uuid, article.title),\
                           makeArticleHTML(article.bodyParagraphs),\
                           makePhraseLevelForm(article.mainEntities),\
                           articleLevelButton(),\
                           makeArticleLevelForm(article.mainEvent, article.mainEntities),\
                           makeFooter(),
                           '</body>'])
