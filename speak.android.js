var application = require("application");

var RC_SPECK = 9001;

var mOnSuccessCallback
var mOnFailCallback
var mOnCancelCallback
var mOnParseFailCallback

exports.registerCallback = function(onSuccessCallback, onCancelCallback, onParseFailCallback, onFailCallback){
  mOnSuccessCallback = onSuccessCallback
  mOnFailCallback = onFailCallback
  mOnCancelCallback = onCancelCallback
  mOnParseFailCallback = onParseFailCallback
}

exports.start = function(typeName, id, label){

  try {

    var intent = new android.content.Intent(android.speech.RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
    intent.putExtra(android.speech.RecognizerIntent.EXTRA_LANGUAGE_MODEL, android.speech.RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
    intent.putExtra(android.speech.RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "pt-BR");
    intent.putExtra(android.speech.RecognizerIntent.EXTRA_PROMPT, label);
   
    if (intent.resolveActivity(application.android.context.getPackageManager()) != null) {
      
      var previousResult = application.android.onActivityResult;
      application.android.onActivityResult = function (requestCode, resultCode, data) {
     
       application.android.onActivityResult = previousResult;
     
         if ( requestCode === RC_SPECK && resultCode === android.app.Activity.RESULT_OK) {
            var matches = data.getStringArrayListExtra(android.speech.RecognizerIntent.EXTRA_RESULTS);

            if(matches && matches.size() > 0){

              if(typeName === 'string'){
                mOnSuccessCallback(id, matches.get(0))
              }else if(typeName === 'double'){

                console.log("####################################################")
                console.log(matches)
                console.log("####################################################")

                try{

                  var replaces = [
                    'com', ',', 'ponto', 'e', 'i', 'virgula', '-'
                  ]

                  for(var i = 0; i < matches.size(); i++){
                    var words  = matches.get(i)
                    var wordsClear  = ""

                    for(var j = 0; j < words.length; j++)
                      if(words[j] != ' ')
                        wordsClear += words[j]

                    for(var j = 0; j < replaces.length; j++)
                      wordsClear = wordsClear.replace(replaces[j], '.')
                    
                    var v = parseFloat(wordsClear)
                  
                    if(v && !isNaN(v)){
                      mOnSuccessCallback(id, v)
                      return
                    }
                    
                  }

                  mOnParseFailCallback(id, matches)

                }catch(e){
                  mOnParseFailCallback(id, matches)
                }
              }else if(typeName === 'int'){
                try{
                  
                  var v = parseInt(matches.get(0))
                  
                  if(!v || isNaN(v))
                    mOnParseFailCallback(id, matches)
                  else
                    mOnSuccessCallback(id, v)

                }catch(e){
                  mOnParseFailCallback(id, matches)
                }
              }

            }else{
              mOnParseFailCallback(id, matches)
            }

         }else{
          if(mOnCancelCallback)
              mOnCancelCallback(id)
         }
      }
     
       application.android.currentContext.startActivityForResult(intent, RC_SPECK);

    }else{
        //as not app speak api
        var browserIntent = new android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse("market://details?id=com.google.android.voicesearch"));        
        application.android.currentContext.startActivity(browserIntent);        
    
    }
  }catch (e) {
    console.log(e)
    mOnFailCallback()
  }    
}