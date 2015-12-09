// check tweet text against various spammy terms
module.exports = function(sourceString) {
  var subStrings = [
    'competition',
    'rt & follow',
    'rt &amp; follow',
    'rt & follow',
    'rt + follow',
    'rt to enter',
    'retweet & follow',
    'retweet',
    'win ',
    'contest ',
    'giveaway',
    'giftideas',
    'perfect gift',
    '% off'
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