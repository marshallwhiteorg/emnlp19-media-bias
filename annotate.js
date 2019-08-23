// All JS for annotation tool


function init(annotations=null, dynamic=true) {
    var sents = document.querySelectorAll(".sent");
    for (var i=0, len=sents.length; i<len; i++) {
        sents[i].onclick = sentenceOnClick();
    }

    if (annotations != null) {
        applyAnnotations(annotations)
    }

    isDynamic = dynamic;
}

function sentenceOnClick() {
  return function() {
      var sent = this.previousElementSibling
      var sent_ann = $("#"+this.id+">.ann_sentence")

      if (sent_ann.length > 0) {
          var ann_id = sent_ann[0].id.split('_')[1]
          editForm(ann_id);
      } else {
          annotate(sent);
      }
  };
}

// globally saved annotations
var ann = {};
var ann_cnt = 0;
var isDynamic = true;

// article-level annotation data
var articleLevelAnnotations = {};

// form questions and their display strings
var formQuestionDisplay = {
    'indirect-ally-opponent-sentiment': 'Sentiment Towards Indirect Target',
    'indirect-target-name': 'Indirect Target',
    'polarity': 'Polarity',
    'aim': 'Aim',
    'bias': 'Bias Type',
    'quote': 'Quote',
    'speaker': 'Speaker',
    'target': 'Main Target',
    'author_feeling_main_event': 'Author\'s feeling toward main event',
    'notes': 'Additional Notes',
    'relative_stance': 'Relative Political Stance'}

// form answers and their display strings
var formAnswerDisplay = {
    'neg': 'Negative',
    'pos': 'Positive',
    'neu': 'Neutral',
    'str-pos': 'Strongly positive',
    'str-neg': 'Strongly negative',
    'sli-pos': 'Slightly positive',
    'sli-neg': 'Slightly negative',
    'yes': 'Yes',
    'no': 'No',
    'other_pro': 'Other (Pro-target)',
    'other_anti': 'Other (Anti-target)',
    'other_neutral': 'Other (Neutral)',
    'lex': 'Lexical',
    'inf': 'Informational',
    'dir': 'Direct',
    'ind_pro': 'Indirect (Ally)',
    'ind_general': 'Indirect (General)',
    'ind_anti': 'Indirect (Opponent)',
    'left': 'More left',
    'center': 'Center',
    'right': 'More right'}

    // returns the display string for the form question
    function displayforQuestion(question) {
        if (question in formQuestionDisplay) {
            return formQuestionDisplay[question];
        }
        else {
            var authorFeeling = 'author_feeling_';
            var youFeeling = 'you_feeling_';
            var words = question.split('_');
            var entity = words.slice(2, words.length).join(' ');
            if (question.startsWith(authorFeeling)) {
                return `Author\'s feeling toward ${entity}`;
            }
            else if (question.startsWith(youFeeling)) {
                return `Your feeling towards ${entity}`;
            }
            else {
                console.log('Internal error: no display for question')
            }
        }
    }

// returns the display string for the form answer
function displayForAnswer(answer) {
    if (answer in formAnswerDisplay) {
        return formAnswerDisplay[answer];
    }
    else {
        // an entity name
        return answer.replace('_', ' ');
    }
}

function updateSubmitButton(annotation) {
    button = document.getElementById("submit")
    if (button != null) {
        button.onclick = function() { submitForm(annotation); }
    }
}

function updateDuplicateButton(annotation) {
    button = document.getElementById("duplicate")
    if (button != null) {
        button.onclick = function() { duplicateSentencePressed(annotation['id']); }
    }
}

function annotate(sentence=null) {
    var selected = {};
    if (sentence == null) {
        selected = get_selection();
    } else {
        selected = get_sentence(sentence);
    }

    if (selected != null) {
        console.log(selected);
        // add_to_article(selected);    // testing only
        updateSubmitButton(selected);
        updateDuplicateButton(selected);
        openForm(selected);
    } else {
        console.log("Nothing selected");
    }
}

// allow the tooltips to show beneath annotation
// if they would otherwise be off screen
function updateTooltips() {
    var tooltipNames = ['.ann_span_lexical',
                        '.ann_span_informational',
                        '.sent',
                        '#article-level-button'];
    tooltipNames.forEach(function(name) {
        $(name).on('mouseenter', function() {
        var $this = $(this);
        var tooltip = $(this).find('.tooltiptext');
        var offset = $this.offset();
        tooltip.toggleClass('bottom', offset.top - tooltip.height() < 10);
        });
    });
}

// show the article-level form
function showArticleLevelForm() {
    // supply the previous answers if they exist
    if (!$.isEmptyObject(articleLevelAnnotations)) {
        $.each(articleLevelAnnotations, function(question, answer) {
            markAnswer(question, answer);
        });
    }
    document.getElementById("article-level-form-div").style.display = "block";
}

function closeArticleLevelForm() {
    document.getElementById("article-level-form-error-msg").innerHTML = "";
    document.getElementById("article-level-form-div").scrollTop = 0;
    document.getElementById("article-level-form").reset();
    document.getElementById("article-level-form-div").style.display = "none";
}

function editForm(id) {
    // populate with answers
    var data = ann[id]
    $('input[name = "polarity"]').filter('[value='+data['polarity']+']').prop('checked', true);
    $('input[name = "aim"]').filter('[value='+data['aim']+']').prop('checked', true);
    $('input[name = "bias"]').filter('[value='+data['bias']+']').prop('checked', true);
    $('input[name = "quote"]').filter('[value='+data['quote']+']').prop('checked', true);

    if ('target' in data) {
        $('input[name = "target"]').filter('[value='+data['target']+']').prop('checked', true);
    }
    if ('speaker' in data && data['quote']=="yes") {
        show_speaker();
        $('input[name = "speaker"]').filter('[value='+data['speaker']+']').prop('checked', true);
    }

    if (data['aim'] != 'dir') {
        showIndirectTargetSentiment();
        markAnswer('indirect-ally-opponent-sentiment', data['indirect-ally-opponent-sentiment']);
        markAnswer('indirect-target-name-label', data['indirect-target-name']);
    }

    if ('notes' in data) {
        $('textarea#notes').val(data['notes']);
    }

    if (isDynamic) {
        // add delete button
        document.getElementById("delete").onclick = function() { delete_annotation(id); }
        document.getElementById("delete").style.display = "inline";

        //display form
        document.getElementById("submit").onclick = function() { submitForm(data, id); }
        document.getElementById("duplicate").onclick = function() { console.log(data);duplicateSentencePressed(data['id']); }
    }
    openForm(data);
}

// mark the answer for the given question in the form
function markAnswer(question, answer) {
    if (question === 'notes') {
        $('textarea#article-level-notes').val(answer);
    }
    else if (question === 'indirect-target-name-label') {
        document.getElementById('indirect-target-name-label').value = answer;
        console.log($('indirect-target-name-label'));
    }
    else {
        $('input[name = "' + question + '"]').filter('[value='+answer+']').prop('checked', true);
    }
}

// convert a dictionary of fields {'name':'x', 'value':'y'} -> {'x':'y'}
function fieldsToAnnotations(fields) {
    anns = {};
    $.each(fields, function(idx, field) {
        anns[field.name] = field.value;
    });
    return anns;
}

// called when user clicks 'submit' in the article-level form
// show error if not all inputs checked, otherwise close form and
// record answers
function submitArticleLevelForm() {
    fields = $.parseJSON(JSON.stringify($("#article-level-form").serializeArray()));
    console.table(fields);
    articleLevelAnnotations = fieldsToAnnotations(fields);
    if ($('div.article-question-div:not(:has(:radio:checked))').length) {
        document.getElementById("article-level-form-error-msg").innerHTML = "Error: Please answer all the questions.";
        return;
    }
    else {
        addArticleLevelTooltip();
        updateTooltips();
        closeArticleLevelForm();
    }
    console.table(articleLevelAnnotations);
}

// add a tooltip to the article-level form
// clears old tooltip if exists
function addArticleLevelTooltip() {
    var tooltipIdName = 'article-level-tooltip';
    var tooltipId = `#${tooltipIdName}`;
    if ($(tooltipId).length != 0) {
        $(tooltipId).remove();
    }
    var tooltipText = getTooltipText(articleLevelAnnotations);
    $("#article-level-button").append(`<span class="tooltiptext" id="${tooltipIdName}">${tooltipText}</span>`);
}

function submitForm(data, id=-1) {
    try {
        if (document.querySelector('input[name = "target"]')) {
            data['target'] = document.querySelector('input[name = "target"]:checked').value;
        }
        data['polarity'] = document.querySelector('input[name = "polarity"]:checked').value;
        data['aim'] = document.querySelector('input[name = "aim"]:checked').value;
    }
    catch (err) {
        document.getElementById("error_msg").innerHTML = "Error: Please answer all the questions.";
        return;
    }

    if (data['aim'] != 'dir') {
        try {
            name = document.querySelector('input[name = "indirect-target-name"]').value;
            if (name != "") {
              data['indirect-target-name'] = name;
            }
            else {
              throw "empty indirect target name";
            }
        }
        catch (err) {
            document.getElementById("error_msg").innerHTML = "Error: If the aim is indirect, specify the target's name.";
            return;
        }
        try {
            data['indirect-ally-opponent-sentiment'] = document.querySelector('input[name = "indirect-ally-opponent-sentiment"]:checked').value;
        }
        catch (err) {
            document.getElementById("error_msg").innerHTML = "Error: If the aim is indirect, specify the sentiment.";
            return;
        }
    }
    else {
        data['indirect-target-name'] = "";
        data['indirect-ally-opponent-sentiment'] = "";
    }

    try {
        data['bias'] = document.querySelector('input[name = "bias"]:checked').value;
        data['quote'] = document.querySelector('input[name = "quote"]:checked').value;
    }
    catch (err) {
        document.getElementById("error_msg").innerHTML = "Error: Please answer all the questions.";
        return;
    }

    if (data['quote'] == "yes") {
        try {
            data['speaker'] = document.querySelector('input[name = "speaker"]:checked').value;
        }
        catch (err) {
            document.getElementById("error_msg").innerHTML = "Error: If bias is in quote, identify the speaker.";
            return;
        }
    } else {
        data['speaker'] = "";
    }

    data['notes'] = $('textarea#notes').val();

    // overwrite if editing, otherwise create new
    if (id >= 0) {
        delete_annotation(id);
        add_to_article(data, id);
        ann[id] = data;
    } else {
        add_to_article(data, ann_cnt);
        ann[ann_cnt] = data;
        ann_cnt+=1;
    }

    console.log(ann);
    closeForm();
}

// get the offsets into the paragraph for the annotation
// returns the offsets as an array of 2 integers, [start, end]
function getAnnotationOffsets(annotation, parHTML) {
    var selectedText = annotation['txt'];
    var start = parHTML.indexOf(selectedText);
    var end = start + selectedText.length;
    return [start, end];
}


// duplicates the paragraph
// tries to make paragraph px:1, continues until px:y does not exist
// duplicate the sentence with parId
function duplicateSentencePressed(parId) {
  var [parIdBase, startIdx] = parIdAndDupIdx(parId);
  startIdx = Math.max(1, startIdx); // min is 1
  var newParId = null;
  while (newParId == null) {
    potentialParId = parIdBase + '_' + startIdx;
    possiblePar = document.getElementById(potentialParId);
    if (possiblePar == null) {
      // that par does not exist yet, we can use this index
      newParId = potentialParId;
    }
    else {
      startIdx++;
    }
  }
  duplicateParagraphNoAnnotations(parId, newParId);
  closeForm();
}

// duplicates the paragraph with id parId
// clears the annotations from the paragraph
function duplicateParagraphNoAnnotations(oldParId, newParId) {
  var originalPar = $(`#${oldParId}`);
  var newPar = originalPar.clone().attr('id', newParId);
  // place after the sentence button and 2 breaks
  originalParSentenceButton = $(`#${oldParId}.sent`);
  newPar.insertAfter(originalParSentenceButton);
  $('<br><br><b>----- Duplicate -----</b><br>').insertAfter(originalParSentenceButton);
  // replace the child annotations with their original text
  annotationChildren = newPar.children(['.ann_span_lexical', '.ann_span_informational']).each(function(idx, child) {
    var id = $(child).attr('id');
    var annNum = id.split('_')[1]; // of the form 'ann_x'
    annText = ann[annNum]['txt'];
    child.outerHTML = annText;
  });
  // unwrap sentence annotation
  newPar.find('.ann_sentence').each(function(idx, found) { found.replaceWith(found.childNodes[0]) });
  sentenceButton =$(`<button class="sent" id="${newParId}">S</button>`);
  sentenceButton.click(sentenceOnClick());
  sentenceButton.insertAfter(newPar);
}


function add_to_article(addAnn, ann_id) {
    var parId = addAnn['id'];
    if (parId == 'title') {
      return; // ignoring title annotations
    }
    var paragraph = document.getElementById(parId);
    if (paragraph == null) {
      // duplicate par id, need to create a new par for this
      var [parIdBase, dupIdx] = parIdAndDupIdx(parId);
      duplicateParagraphNoAnnotations(parIdBase, parId);
      paragraph = document.getElementById(parId);
    }
    var para_txt = $(paragraph).text();
    if (para_txt.length == addAnn['txt'].length) {
        var tooltipText = getTooltipText(addAnn)
        $(`#${parId}.sent`).append(`<span class="tooltiptext" id="tooltip${ann_id}">${tooltipText}</span>`);
        paragraph.innerHTML = '<span class="ann ann_sentence" id="ann_' + ann_id + '">' + paragraph.innerHTML + '</span>';
    } else {
        var para_html = paragraph.innerHTML;
        var offsets = getAnnotationOffsets(addAnn, para_html);
        selection = para_html.substring(...offsets)
        beginning = para_html.substring(0,offsets[0])
        ending = para_html.substring(offsets[1]);

        paragraph.innerHTML = createParagraphHTML(addAnn, ann_id, beginning, ending, selection);
    }
    updateTooltips();
}

// returns the finished html for the paragraph
function createParagraphHTML(ann, annId, beginText, endText, body) {
    var spanClass = getSpanClass(ann);
    var annIdHTML = 'id=' + '"' + 'ann_' + annId + '"';
    var endTag = "</span>";
    var annSpan = '<span class="ann" onclick="editForm(' + annId + ')">' + body + '</span>';
    var tooltipText = getTooltipText(ann);
    var tooltipSpan = '<span class="tooltiptext" onclick="editForm(' + annId + ')">' + tooltipText + '</span>';
    var result = beginText + '<span class="' + spanClass + '"'+ annIdHTML + '>'
               + tooltipSpan
               + annSpan
               + endTag
               + endText;
    return result;
}

// returns the tooltip text for the given annotation
function getTooltipText(ann) {
    var excludedKeys = ['txt', 'start', 'end', 'id'];
    var result = "";
    $.each(ann, function(k, v) {
        if (!excludedKeys.includes(k) && v != "") {
            result += displayforQuestion(k) + ' : ' + displayForAnswer(v) + '\n';
        }
    });
    return result;
}

// get span class, dependent on bias type
function getSpanClass(ann) {
  if (ann['bias'] === 'lex') {
    return "ann_span_lexical";
  }
  else {
    return "ann_span_informational";
  }
}

function openForm(selected) {
    document.getElementById("selected_text").innerHTML = selected['txt'];    // show selected text at top
    document.getElementById("myForm").style.display = "block";  // open new annotation form popup
}

function closeForm() {
    document.getElementById("error_msg").innerHTML = "";
    document.getElementById("myForm").scrollTop = 0;
    document.getElementById("form_data").reset();
    deleteButton = document.getElementById("delete")
    if (deleteButton != null) {
        deleteButton.style.display = "none";
    }
    hide_speaker();
    hideIndirectTargetSentiment();
    document.getElementById("myForm").style.display = "none";
}

// returns true if the annNumber annotation is a sentence annotation
function isSentenceAnnotation(annNumber) {
    var annotation = ann[annNumber];
    var par = document.getElementById(annotation['id']);
    var parText = $(par).text();
    return parText.length == annotation['txt'].length;
}

function delete_annotation(ann_id) {
    var elementId = "ann_" + ann_id;
    var spanText = ann[ann_id]['txt'];
    document.getElementById(elementId).outerHTML = spanText;
    if (isSentenceAnnotation(ann_id)) {
        removeTooltipFromSentence(ann_id)
    }
    closeForm();
    delete ann[ann_id];
}

// removes the tooltip from the button for the given sentence
function removeTooltipFromSentence(annNumber) {
    document.getElementById(`tooltip${annNumber}`).outerHTML = "";
}

function show_speaker() {
    showElement('speaker');
}

// make the indirect target sentiment question visible
function showIndirectTargetSentiment() {
    showElement('indirect-ally-opponent-sentiment');
    showElement('indirect-target-name');
}

// make the element with the given id visible
function showElement(elementId) {
    document.getElementById(elementId).style.display = "inline";
}

function hide_speaker() {
    hideQuestion('speaker');
}

// hide indirect target sentiment question
function hideIndirectTargetSentiment() {
    hideQuestion('indirect-ally-opponent-sentiment');
    hideQuestion('indirect-target-name');
}

// hide and uncheck the question with the given name
function hideQuestion(question) {
    $('input[name="' + question + '"]').prop('checked',false);
    document.getElementById(question).style.display = "none";
}

// return a stringified dictionary with two keys:
// - article-level-annotations
// - phrase-level-annotations
function stringFromAllAnnotations() {
    var phraseAnnValues = [];
    for (var key in ann) {
        phraseAnnValues.push(ann[key]);
    }
    var annsResult = {'triplet-uuid': tripletUuid,
                      'uuid': uuid,
                      'article-level-annotations': articleLevelAnnotations,
                      'phrase-level-annotations': phraseAnnValues};
    return JSON.stringify(annsResult, null, 4);
}

// prompt user for initials
// returns initials, or false if user cancels
function getInitials() {
    return prompt("Please enter your initials", "");
}

function download_annotations() {
    var initials = getInitials();
    if (initials == null) {  // a cancellation
        return;
    }
    var data_str = stringFromAllAnnotations();
    var data = new Blob([data_str], {type: 'application/json'});
    var link = document.createElement('a');
    var initialsPrefix = '';
    if (initials != '') {
        initialsPrefix = initials + '_';
    }

    // file ID defined at top of HTML page
    link.setAttribute('download', initialsPrefix + file_id + '_ann.json');
    link.href = window.URL.createObjectURL(data);

    document.body.appendChild(link);

    // wait for the link to be added to the document
    window.requestAnimationFrame(function () {
        var event = new MouseEvent('click');
        link.dispatchEvent(event);
        document.body.removeChild(link);
    });
}

// remove all annotations
function removeAllAnnotations() {
    for (var annNumber in ann) {
        delete_annotation(annNumber);
    }
    ann_cnt = 0;
}

function importFile(files) {
    removeAllAnnotations();
    var reader = new FileReader();
    reader.readAsText(files[0]);

    reader.onload = function(e) {
        try {
            document.getElementById("import_error").innerHTML ='';
            var allAnns = JSON.parse(reader.result);
            applyAnnotations(allAnns);
        }
        catch (err) {
            console.log(err);
            document.getElementById("import_error").innerHTML ='Error: Selected file has incorrect format.'
        }
    }
}

// apply all the annotations, incl. phrase and article level annotations
function applyAnnotations(annotations) {
    articleLevelAnnotations = annotations['article-level-annotations'];
    $.each(annotations['phrase-level-annotations'], function(idx, pla) {
        ann[idx] = pla;
        ann_cnt += 1;
        add_to_article(pla, idx);
    });
}

function get_sentence(sent) {
  if ($(sent).children(['.ann_span_lexical', '.ann_span_informational']).size() > 0) {
    console.log('OVERLAP');
    return null;
  }
  else {
    var sent_txt = $(sent).text();
    var sel = {'txt': sent_txt,
                'id': sent.id,
                'start': 0,
                'end': sent_txt.length}
    return sel;
  }
}

// returns true if the character is punctuation
function isPunctuation(char) {
    return /[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^_`{|}~]/.test(char)
}


function get_selection() {
    // https://stackoverflow.com/questions/7380190/select-whole-word-with-getselection


    // Check for existence of window.getSelection() and that it has a
    // modify() method. IE 9 has both selection APIs but no modify() method.
    if (window.getSelection && (sel = window.getSelection()).modify) {
        var sel = window.getSelection();

        let startingText = sel.toString();
        let startsWithPunctuation = isPunctuation(startingText.substr(0, 1));
        let endsWithPunctuation = isPunctuation(startingText.substr(-1));

        if (!sel.isCollapsed) {
            // Check that selection is within sentence
            if (sel.anchorNode != sel.focusNode) {
                console.log('err')
                return;
            }

            // reverse start and end indices if backwards
            var direction = [];
            if (sel.anchorOffset > sel.focusOffset) {
                direction = ['backward', 'forward'];
            } else {
                direction = ['forward', 'backward'];
            }

            // modify() works on the focus of the selection
            var endNode = sel.focusNode;
            var endOffset = sel.focusOffset;

            // only complete the words if selection neither starts nor ends with punctuation
            // this requirement is due to a bug when the selection starts or ends with punctuation

            if (!startsWithPunctuation && !endsWithPunctuation) {
                sel.collapse(sel.anchorNode, sel.anchorOffset);
                sel.modify("move", direction[0], "character");
                sel.modify("move", direction[1], "word");
                sel.extend(endNode, endOffset);
                sel.modify("extend", direction[1], "character");
                sel.modify("extend", direction[0], "word");
            }

            var offsets = [sel.anchorOffset,sel.focusOffset];

            // if another annotation already exists in sentence, adjust so the annotation span isn't the anchor/focus offset
            var full_sent = sel.anchorNode.parentElement
            // this test is very hacky and should be fixed
            if (full_sent.innerHTML.includes('<span class="tooltiptext"')) {
                var cutoff = full_sent.innerText.indexOf(sel.anchorNode.textContent).index
                offsets[0] += cutoff
                offsets[1] += cutoff
            }

            var selected = {'txt': sel.toString(),
                            'id': sel.anchorNode.parentElement.id,
                            'start': Math.min(...offsets),
                            'end': Math.max(...offsets)}

            if (sel.anchorNode.parentElement.id.includes('ann')) {
              console.log('OVERLAP');
              return null;
            }
            else {
              console.log(selected);
              return selected;
            }
        }
    }
    else {
        alert("Browser not supported. Please try using Chrome, Safari, or Firefox 55.0+.");
        return;
    }
}

function parIdAndDupIdx(id) {
  // we now allow annotations within other annotations, but use multiple
  // lines to do it.
  // this requires one paragraph per overlapping annotation,
  // where the first one might have id 'p0'
  // and the first paragraph with an overlapping span would have id 'p0_1'
  if (id.indexOf('_') > -1) {
    var elems = id.split('_');
    var parId = elems[0]
    var dupIdx = parseInt(elems[1])
    return [parId, dupIdx];
  }
  else {
    return [id, 0];
  }
}
