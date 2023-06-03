const urlJson = 'URL:Port of the middleware';
const current = new Date();
let timing;
let overviewData = [];
let x = 0;
// let direction;
// let type;
// let track;


//Get Variable Tags from Device
function getTagsFromScreens() {

  const tagtemp = $wp.device.getProperty('variable_tag');
  //  $wp.utility.log(JSON.stringify(tagtemp));

  let direction = tagtemp[0].value; // can be Departres or Arrivals
  let type = tagtemp[1].value; // can be trackdisplay or overview
  let track = tagtemp[2].value; // number

  // $wp.utility.log('Track Value :', track);
  $wp.content.getPage('Page1').getElement("Track").setProperty("text", `${track}`);

  if (type === 'overview') {
    $wp.content.movePage('Page2');
    getOverviewData(direction);
  }

  if (type === 'trackdisplay') {
    $wp.content.movePage('Page1');
    getTrackData(track);
  }

};


// get json file and create an array of objects with its elements
function getTrackData(track) {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", `${urlJson}/api/sbb/track/${track}`, true);

  xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
  xhr.send();

  let response;

  xhr.onreadystatechange = () => {
    if (xhr.readyState == 4 && xhr.status == 200) {
      response = JSON.parse(xhr.responseText);

      let trackData = {
        destination: response[0].dest,
        train: response[0].train,
        t1: response[0].t1,
        diff: `+${response[0].diff}`
      }

      const departureTime = new Date(trackData.t1);
      const newTime = `${checkTime(departureTime.getHours())}:${checkTime(departureTime.getMinutes())}`;

      $wp.content.getPage('Page1').getElement("Destination").setProperty("text", `${trackData.train} - ${trackData.destination}`);
      $wp.content.getPage('Page1').getElement("Time").setProperty("text", `${newTime}`);

      if (trackData.diff > 0) { $wp.content.getPage('Page1').getElement("Delay").setProperty("text", `${trackData.diff}`); }
      else { $wp.content.getPage('Page1').getElement("Delay").setProperty("text", ``); }
      $wp.content.getPage('Page1').getElement("Train").setProperty("text", ``);

    }
  }
};

//function that will modify text values in WPlayer and will change colors of the status text depending on the value
function showOverviewData(response) {
  let j = 1; // first textfield number
  response.forEach((train) => {
    if (j < 104) {
      // 41 is the amount of text fields
      Object.values(train).forEach((val) => {

        $wp.content.getPage('Page2').getElement(`Text${j}`).setProperty("text", `${val}`);
        j++;
      });
    }
  });
  //clear remaining text values if there are not enough items to be displayed (less than 7)
  // if (j > 104) {
  //   for (let i = j; i <= response.length; i++) {
  //     $wp.content.getPage('Page2').getElement(`Text${i}`).setProperty("text", "");
  //   }
  // }
  x += 26;
}

function getOverviewData(dir) {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", `${urlJson}/api/sbb/direction/${dir}`, true);
  //console.log('OPEN: ', xhr.readyState);
  // xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
  xhr.send();
  //console.log('SENT: ', xhr.readyState);
  //console.log(xhr.responseText);
  let response;
  xhr.onreadystatechange = () => {
    if (xhr.readyState == 4 && xhr.status == 200) {
      response = JSON.parse(xhr.responseText);


      //console.log('response ', response);
      for (i = 0; i < response.length; i++) {

        const departureTime = new Date(response[i].t1);
        const newTime = `${checkTime(departureTime.getHours())}:${checkTime(departureTime.getMinutes())}`;
        let late = '';
        if (response[i].diff == 0) late = '';
        if (response[i].diff > 0) late = `+${response[i].diff}`;

        let tempData = {

          t1: newTime,
          diff: late,
          destination: `${response[i].dest} (${response[i].train})`,
          track: response[i].track,

        }
        overviewData.push(tempData)
      }



      // $wp.content.getPage('Page1').getElement("Destination").setProperty("text", `${trackData.train} - ${trackData.destination}`);
      // $wp.content.getPage('Page1').getElement("Time").setProperty("text", `${newTime}`);

      // if (trackData.diff > 0) { $wp.content.getPage('Page1').getElement("Delay").setProperty("text", `${trackData.diff}`); }
      // else { $wp.content.getPage('Page1').getElement("Delay").setProperty("text", ``); }
      // $wp.content.getPage('Page1').getElement("Train").setProperty("text", ``);


      //console.log('fullResponse3', fullResponse);
    }
    showOverviewData(overviewData);
  }
};


function checkTime(i) {
  if (i < 10) {
    i = "0" + i;
  }
  return i;
};


function looping() {
  // setTimeout(() => { getTagsFromScreens(), 10000 });
  getTagsFromScreens();
  timing = setTimeout(looping, 10000)
};


$wp.setDefaultCallback(function (object) {
  switch (object.type) {
    case "state":
      switch (object.sub) {
        case "ready":
          //$wp.utility.log(`ElementHtml get 'ready' state`);
          looping()
          break;
        case "play":
          //$wp.utility.log(`ElementHtml get 'play' state`);
          //clearTimeout(timing);
          //looping()
          // setTimeout(getTagsFromScreens(), 20000);
          break;
        case "stop":
          $wp = null;
          break;
        default:
          break;
      }
      break;
    case "udp":
      break;
    case "datalink":
      break;
    default:
      break;
  }
});
