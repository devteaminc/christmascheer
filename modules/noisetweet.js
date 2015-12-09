// check tweet text against various noise terms
module.exports = function(sourceString) {
  var subStrings = [
    'harry styles',
    'harry_styles',
    'niallofficial',
    'louis_tomlinson',
    'real_liam_payne',
    'burn victim', // lots of tweets about this little girl which we don't want to show
    'arson',  // see above
    'burned little girl',  // see above
    'little girl',  // see above
  ];
  
  var found = false;

  for (var j=0; j<subStrings.length; j++) {
    if (sourceString.toLowerCase().indexOf(subStrings[j]) !== -1) {
      found = true;
      break;
    }
  }
  return found;
};