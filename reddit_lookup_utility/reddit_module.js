
let userComments = [];
let postComments = [];
const SERVER_PATH = 'http://138.68.243.184:8080';
// const SERVER_PATH = 'http://localhost:8080';

// Judicious filtering of utilities
function filterContent() {
  if (window.location.href.match(/(\?user=.*)/)) {
    document.getElementById('redditorSection').style.display = 'block';
    document.getElementById('twitterIntegration').style.display = 'block';
  }
}

// PAGE TWO
// ----------
function shouldFilterContent() {
    return !window.location.href.match(/(\?user=.*)/);
}

function searchRedditorInfo() {
  let username = document.getElementById('redditorInfo').value.trim();
  let icon = document.getElementById('userIcon');
  let userLink = document.getElementById('userLink');
  document.getElementById('commentSearch').style.display = 'none';
  document.getElementById('favoriteSubreddits').innerHTML = '';
  icon.src = '';
  userLink.innerHTML = '';
  makeHTTPRequest(`http://138.68.243.184:8080/reddit/redditor?user=${username}`
  ,'GET'
  ,function () {
    if (this.status !== 200) {
      console.log(this);
      return;
    }

    document.getElementById('userInfo').style.display = 'block';
    document.getElementById('redditor').innerHTML = username;

    // clear previous values
    document.getElementById('rawInfo').value = '';
    document.getElementById('commentsDisplay').value = '';

    let result = JSON.parse(this.responseText);
    if (result.message && result.message == 'Unauthorized') {
      document.getElementById('rawInfo').value = 'Server submitted an unauthorized request. Please reload and try again.';
      return;
    }
    if (result.message && result.message == 'Not Found') {
      document.getElementById('rawInfo').value = 'User was not found.';
      document.getElementById('commentsDisplay').value = 'User was not found.';
    }

    // parse results
    let infoObj = result.data;

    // Display results
    Object.keys(infoObj).forEach((element) => {
      if (element == 'icon_img') {
        infoObj[element] = formatIconLink(infoObj[element]);
      }
      let value = `${element}: ${infoObj[element]} \n`;
        if (element == 'subreddit' && infoObj[element]) {
            value = '-------------------------------\n';
            value += parseUserSubreddit(infoObj[element]);
            value += '-------------------------------\n';
          }

      document.getElementById('rawInfo').value += value;
    });
    icon.src = formatIconLink(infoObj.icon_img);
    userLink.href = `http://old.reddit.com/u/${username}`;
    userLink.innerHTML = `/u/${username}:`;

    getComments(username);
  });
}

function formatIconLink(url) {
  return url.replace(/amp;/g, '');
}

function parseUserSubreddit(subreddit) {
  let infoString = '';
  Object.keys(subreddit).forEach((key) => {
    infoString += `${key}: ${subreddit[key]}\n`;
  });
  return infoString;
}

/**
 * Retrieves a map of active commenters in the Hot posts of a subreddit.
 * @param subreddit
 */
function getActiveCommenters(subreddit) {
  return new Promise((resolve, reject) => {
	  makeHTTPRequest(`${SERVER_PATH}/reddit/subreddit/activeRedditors?subreddit=${subreddit}&scope=hot`
		  , 'GET'
		  , function getACSuccess () {
			  if (this.status !== 200) {
				  console.log(this);
				  return;
			  }

			  resolve(JSON.parse(this.responseText));

			  const result = JSON.parse(this.responseText);

		  }
		  , function getACError() {
			  console.warn('ERROR:', this);
		  })
  });
}

/**
 * Retrieves the 1000 most recent comments for a given user
 * @param user {String}
 * @returns {Promise<Array<Comment>>}
 */
function requestComments(user, scope = 'all') {
  return new Promise((resolve, reject) => {
    makeHTTPRequest(`${SERVER_PATH}/reddit/comments?user=${user}&scope=${scope}`
    , 'GET'
    , function () {
        if (this.status !== 200) {
          reject(this);
        }
        resolve(JSON.parse(this.responseText));
      }
    , function () {})
  });
}

/**
 * [RENAME THIS FUNCTION] Gets the most recent comments for a specified user and does a bunch of UI stuff with it.
 * @param user {String}
 */
function getComments(user) {
    let input = document.getElementById('commentUsername');
    let username = user || input.value;
    requestComments(username)
        .then((commentArray) => {
          userComments = commentArray;  // Populate the global variable
          let commentBox = document.getElementById('commentsDisplay');
          if (commentArray.length <= 0) {
            commentBox.value = 'No comments found.';
          }
          commentArray.forEach((comment) => {
            commentBox.value += `${comment.body}\n\n`;
          });
          populateSubList();
          document.getElementById('commentSearch').style.display = 'block';
        })
        .catch((error) => {
          console.warn('Error in function getComments:', error);
        });
}

function populateSubList() {
  //clear existing subreddit list
  let select = document.getElementById('subredditSelect');
  select.innerHTML = '';

  // collect subreddits
  let map = mapSubreddits(userComments);
  Object.keys(map)
  .sort((a, b) => {
    const aL = a.toLowerCase();
    const bL = b.toLowerCase();
    if (aL > bL) { return 1; }
    if (aL == bL) { return 0; }
    return -1;
  })
  .forEach((subreddit) => {
    let option = document.createElement('option');
    option.value = subreddit;
    option.text = subreddit;
    select.add(option);
  });
  select.selectedIndex = -1;
}

/**
 * Retrieves the search term from the input box,
 * and searches the collected user comments to find where it is included.
 */
function searchComments() {
  //clear previous values
  document.getElementById('searchResultsHTML').innerHTML = '';

    let searchTerm = document.getElementById('searchText').value;
    userComments.forEach(comment => {
       if (comment.body.toUpperCase().includes(searchTerm.toUpperCase())) {
           document.getElementById("searchResultsHTML").innerHTML += `<p><a href=${comment.permalink}>${comment.body}</a><p>`;
       }
    });
}

function displaySubComments() {
  //clear previous values
  let div = document.getElementById('redditorSubComments');
  div.innerHTML = '';

  let subreddit = document.getElementById('subredditSelect').value;
  userComments.forEach(comment => {
    if (comment.subreddit.toLowerCase() == subreddit.toLowerCase()) {
      div.innerHTML += `<p><a href=${comment.permalink}>${comment.body}</a><p>`;
    }
  });
}

function getFavoriteSubreddits() {
  let subMap = mapSubreddits(userComments);

  // TODO: utiilize sortWeightedMapIntoArray here
  let subArray = Object.keys(subMap).sort(function (a, b) {
    return subMap[b] - subMap[a];
  });
  let subCount = subArray.map((sub) => {
    return {
      subreddit: sub,
      count: subMap[sub]
    };
  });
  let list = document.getElementById('favoriteSubreddits');
  list.innerHTML = '';
  subCount.forEach((sub, i) => {
    list.innerHTML += `<a href="http://old.reddit.com/r/${sub.subreddit}" class="subreddit" style="font-size: ${(sub.count / 2) + 11}px;">${sub.subreddit}</a>`;
  });
}

function mapSubreddits(comments) {
  let subMap = {};
  comments.forEach((comment) => {
    subMap[comment.subreddit] = subMap[comment.subreddit] ? subMap[comment.subreddit] + 1 : 1;
  });
  return subMap;
}

function sortWeightedMapIntoArray(weightMap) {
  let weightArray = Object.keys(weightMap).sort(function (a, b) {
    return weightMap[b] - weightMap[a];
  });
  return weightArray.map((key) => {
    return {
      key: key,
      count: weightMap[key]
    };
  });
}

function collectUserLinks() {
    // Retrieve all links that the user has posted in their comments

    // TODO: do this automatically instead?
    let linkList = [];
    userComments.forEach((comment) => {
        linkList = linkList.concat(extractLinks(comment));
    });

    // Display them in the linkList div
    let listDiv = document.getElementById('linkList');
    listDiv.innerHTML = '';
    linkList.forEach((link) => {
      listDiv.innerHTML += `${link.link} (from <a href=${link.comment.permalink}>this comment</a>)<br> `;
    });
}

function extractLinks(comment, index) {
    if (index) {
      comment.body = comment.body.substring(index);
    }

    let links = [];
    if (comment.body.includes('http')) {

      //check for markdown
      let markdown = getMarkdownLink(comment.body);
      if (markdown) {
        links.push({link: markdown, comment});
      } else {
        let linkMatch = comment.body.match(/(http\S*)/);
        let linkHTML = `<a href="${linkMatch[0]}">${linkMatch[0]}</a>`;
        links.push({link: linkHTML, comment});
      }
    }
    return links;
}

function getMarkdownLink(body) {
  let match = body.match(/(\[.*\]\(http.*\))/);
  if (match) {
    return formatMarkdownLink(match[0]);
  }
  return null;
}

function formatMarkdownLink(mdLink) {
  let textMatch = mdLink.match(/(\[.*\])/);
  if (!textMatch) {
    return null;
  }
  // let text = textMatch[0].substring(1, textMatch[0].length - 2);

  let hrefMatch = mdLink.match(/(\(http.*\))/);
  if (!hrefMatch) {
    return null;
  }
  let href = hrefMatch[0].substring(1, hrefMatch[0].length - 1);

  return `<a href="${href}">${textMatch[0]}</a>`;
}

function isBreakingChar(char) {
  switch (char) {
    case ' ':
      return true;
      break;
    case '&':
      return true;
      break;
    case ']':
      return true;
      break;
    case ')':
      return true;
      break;
    default:
      return false;
  }
}

function formatLink(comment) {

}

function getSubredditIntersection() {
	document.getElementById('subredditorInfo').style.display = 'block';
  let subreddit = document.getElementById('subredditSearch').value;
	document.getElementById('subName').innerHTML = subreddit;
  document.getElementById('subName2').innerHTML = subreddit;
  let list = document.getElementById('intersectionList');
  list.innerHTML = 'Loading...';

  // Get external Links
  getExternalSubLinks(subreddit)

  // Populate subreddit associations
  const subredditMap = {};
  getActiveCommenters(subreddit)
    .then((redditorMap) => {
      const redditors = Object.keys(redditorMap);
      const totalRedditors = redditors.length;
      let r = 0;
        redditors.forEach((commenter) => {
          requestComments(commenter, 'recent')
            .then((comments) => {
              comments.forEach((comment) => {
                if (subredditMap[comment.subreddit]) {
                    if (comment.subreddit.toLowerCase() === subreddit.toLowerCase()) {
                        return;
                    }

                    subredditMap[comment.subreddit]++;
                } else {
                  subredditMap[comment.subreddit] = 1;
                }
              });
              // setTimeout(() => getExternalSubLinks(subredditMap), 0);
              r++;
              if (r >= totalRedditors) {
                // Process subreddit map, using weight of commenter map.
				  let subArray = Object.keys(subredditMap).sort(function (a, b) {
					  return subredditMap[b] - subredditMap[a];
				  });
				  let subredditList = subArray.map((sub) => {
					  return {
						  subreddit: sub,
						  count: subredditMap[sub]
					  };
                  });

				  list.innerHTML = '';
				  for (let i = 0; i < subredditList.length; i++) {
				      if (subredditList[i].count <= 1) {
				          continue;
                      }
					  let link = `<a href="http://old.reddit.com/r/${subredditList[i].subreddit}" class="subreddit" style="font-size: ${(subredditList[i].count / 3) + 10}px;">${subredditList[i].subreddit}</a>`
					  list.innerHTML += link;
				  }
              }
            })
            .catch((error) => {
              console.warn('Error while requesting comments of each commenter:', error);
            });
        });
    })
    .catch((error) => {
      console.warn(`Error while requesting active commenters for subreddit ${subreddit}:`, error);
    })

  getCrossReferences();
}

function getHotComments(subreddit) {
  return new Promise((resolve, reject) => {
    makeHTTPPromise(`${SERVER_PATH}/reddit/subreddit/comments/hot?subreddit=${subreddit}`, 'GET')
      .then(resolve)
      .catch(reject);
  });
}

function getExternalSubLinks(subreddit) {
  const extLinkListDiv = document.getElementById('commenterLinkList');
  extLinkListDiv.innerText = "Loading...";
  getHotComments(subreddit)
    .then(result => {
      try {
        let allLinks = [];
        const threads = JSON.parse(result);
        threads.forEach(thread => {
          thread.forEach(comment => {
            links = extractLinks(comment);
            if (links.length > 0) {
              allLinks = allLinks.concat(links);
            }
          });
        });
        const linksHTML = allLinks.map(linkObj => `<li>${linkObj.link}</li>`).join("");
        extLinkListDiv.innerHTML = linksHTML;
      }
      catch(e) {
        console.log('There was an error when collecting commments:', e);
      }
    })
    .catch(err => {
      console.log('There was an error!', err);
    });
}

function getCrossReferences() {
  let subreddit = document.getElementById('subredditSearch').value;
  let crossList = document.getElementById('crossReferenceList');
  crossList.innerHTML = 'Loading...';
  // get all posts from Hot
  makeHTTPRequest(`http://138.68.243.184:8080/reddit/subreddit/comments/hot?subreddit=${subreddit}`
    , 'GET'
    , function (result) {
      let threads = JSON.parse(this.responseText);
      let crossMap = {};
      threads.forEach((thread) => {
        thread.forEach((comment) => {
          // make map of subreddit links with '/r/'
          if (!comment.body) {
            return;
          }
          let match = comment.body.match(/(\/r\/\w*)/);
          if (match) {
            if (crossMap[match[0]]) {
              crossMap[match[0]]++;
            } else {
              crossMap[match[0]] = 1;
            }
          }
        });
      });
      let sortedLinkMap = sortWeightedMapIntoArray(crossMap);
      crossList.innerHTML = '';
      sortedLinkMap.forEach((crossLink) => {
        if (crossLink.key !== `/r/${subreddit}`) {
            crossList.innerHTML += `<a style="font-size: ${(crossLink.count * 2) + 12}px;" class="subreddit" href="http://old.reddit.com${crossLink.key}">${crossLink.key}</a>`;
        }
      });

      if (crossList.innerHTML == '') {
        crossList.innerHTML = 'None found.';
      }
  });
}

function getPostInfo() {
  let postLoc = parsePostURL();
  displayPostLinks(postLoc);
  displayPostUserMap(postLoc);
}

function displayPostLinks({subreddit, id}) {
  document.getElementById('postLinkListWrapper').style.display = 'block';
  let linkListDiv = document.getElementById('postLinkList');
  linkListDiv.innerHTML = 'Loading...';

  makeHTTPRequest(`${SERVER_PATH}/reddit/post/comments?subreddit=${subreddit}&id=${id}`, 'GET', function() {
    result = JSON.parse(this.responseText);
    if (typeof result !== 'object' || !Array.isArray(result)) {
      console.log('Post comments were not available:', result);
      return;
    }

    postComments = result;
    let postLinks = [];
    result.forEach((thread) => {
      thread.forEach((comment) => {
        if (!comment) {return;}
        postLinks = postLinks.concat(extractLinks(comment));
      });
    });

    linkListDiv.innerHTML = '';
    if (postLinks.length == 0) {
        linkListDiv.innerHTML = 'No links found.';
    }

    postLinks.forEach((link) => {
      linkListDiv.innerHTML += `<p>${link.link} from <a href="${link.comment.permalink}">this comment</a></p>`;
    });

  });
}

function displayPostUserMap({ subreddit, id }) {
  document.getElementById('postUserMap').style.display = 'block';
  let userMapDiv = document.getElementById('postUserMap_List');
  userMapDiv.innerHTML = 'Loading...';
  makeHTTPPromise(`${SERVER_PATH}/reddit/post/replyGraph?subreddit=${subreddit}&id=${id}`, 'GET')
    .then((result) => {
      result = JSON.parse(result);
      const resultDiv = document.getElementById('postUserMap_List');
      let userMapHTML = '';
      result.forEach((user) => {
        console.log('user:', user);
        // userMapHTML += `<a href="" style="font-size: ${(sub.count / 2) + 11}px;">${user}</a>`
        userMapHTML += ` <a href="" style="font-size: ${(user[1] / 3) * 10}px">${user[0]}</a> `
      });
      resultDiv.innerHTML = userMapHTML;
    })
    .catch((error) => {
      console.log('error while displaying user map:', error);
      resultDiv.innerHTML = 'Something went wrong while trying to fetch social activity. Check the console.';
    });
}

function parsePostURL() {
  let url = document.getElementById('postURL').value;
  let subMatch = url.match(/(\/r\/.*?\/)/);
  let subreddit = subMatch[0].replace('/r/', '').replace('/', '');
  let idMatch = url.match(/(\/comments\/.*?\/)/);
  let id = idMatch[0].replace('/comments/', '').replace('/', '');
  return {subreddit, id};
}

function makeHTTPRequest(url, method, callback, errorCallback) {
    let request = new XMLHttpRequest();
    request.open(method, url);
    request.onload = callback;
    request.onerror = errorCallback || displayError;
    request.send();
}

function makeHTTPPromise(url, method) {
  return new Promise((resolve, reject) => {
    let request = new XMLHttpRequest();
    request.open(method, url);
    request.onload = (event) => resolve(event.target.responseText);
    request.onerror = reject;
    request.send();
  });
}

function displayError() {
  console.log('An error occurred:', this);
}
