// check tweet text against various spammy terms
module.exports = function(sourceString) {
  var subStrings = [
    'competition',
    'rt & follow',
    'rt &amp; follow',
    'rt & follow',
    'rt + follow',
    'retweet & follow',
    'retweet',
    'win ',
    'contest ',
    'giveaway',
    'giftideas',
    'perfect gift',
    'harry styles',
    'harry_styles',
    'niallofficial',
    'louis_tomlinson',
    'real_liam_payne'
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