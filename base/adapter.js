var RTCPeerConnection = null;
var getUserMedia = null;
var attachMediaStream = null;
var reattachMediaStream = null;
var webrtcDetectedBrowser = null;
var webrtcDetectedVersion = null;
var TemPluginActivated = null;

  //DEBUG
  function plugin0()
  {
      return document.getElementById('plugin0');
  }
  plugin = plugin0;

  if (plugin())
    plugin().setLogFunction(console);

function trace(text) {
  // This function is used for logging.
  if (text[text.length - 1] == '\n') {
    text = text.substring(0, text.length - 1);
  }
  console.log(/*(performance.now() / 1000).toFixed(3) + ": " +*/ text); // some browsers don't have a performance object
}

if (navigator.mozGetUserMedia) {
  console.log("This appears to be Firefox");

  webrtcDetectedBrowser = "firefox";

  webrtcDetectedVersion =
           parseInt(navigator.userAgent.match(/Firefox\/([0-9]+)\./)[1], 10);

  // The RTCPeerConnection object.
  RTCPeerConnection = mozRTCPeerConnection;

  // The RTCSessionDescription object.
  RTCSessionDescription = mozRTCSessionDescription;

  // The RTCIceCandidate object.
  RTCIceCandidate = mozRTCIceCandidate;

  // Get UserMedia (only difference is the prefix).
  // Code from Adam Barth.
  getUserMedia = navigator.mozGetUserMedia.bind(navigator);
  navigator.getUserMedia = getUserMedia;

  // Creates iceServer from the url for FF.
  createIceServer = function(url, username, password) {
    var iceServer = null;
    var url_parts = url.split(':');
    if (url_parts[0].indexOf('stun') === 0) {
      // Create iceServer with stun url.
      iceServer = { 'url': url };
    } else if (url_parts[0].indexOf('turn') === 0) {
      if (webrtcDetectedVersion < 27) {
        // Create iceServer with turn url.
        // Ignore the transport parameter from TURN url for FF version <=27.
        var turn_url_parts = url.split("?");
        // Return null for createIceServer if transport=tcp.
        if (turn_url_parts.length === 1 ||
            turn_url_parts[1].indexOf('transport=udp') === 0) {
          iceServer = { 'url': turn_url_parts[0],
                        'credential': password,
                        'username': username };
        }
      } else {
        // FF 27 and above supports transport parameters in TURN url,
        // So passing in the full url to create iceServer.
        iceServer = { 'url': url,
                      'credential': password,
                      'username': username };
      }
    }
    return iceServer;
  };

  // Attach a media stream to an element.
  attachMediaStream = function(element, stream) {
    console.log("Attaching media stream");
    element.mozSrcObject = stream;
    element.play();
  };

  reattachMediaStream = function(to, from) {
    console.log("Reattaching media stream");
    to.mozSrcObject = from.mozSrcObject;
    to.play();
  };

  // Fake get{Video,Audio}Tracks
  if (!MediaStream.prototype.getVideoTracks) {
    MediaStream.prototype.getVideoTracks = function() {
      return [];
    };
  }

  if (!MediaStream.prototype.getAudioTracks) {
    MediaStream.prototype.getAudioTracks = function() {
      return [];
    };
  }
} else if (navigator.webkitGetUserMedia) { //////////////////////////////////////////////////////////////////////////////////////
  console.log("This appears to be Chrome");

  webrtcDetectedBrowser = "chrome";
  webrtcDetectedVersion =
         parseInt(navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)[2], 10);

  TemPluginActivated = plugin() && plugin().valid;

  // Creates iceServer from the url for Chrome.
  createIceServer = function(url, username, password) {
    var iceServer = null;
    var url_parts = url.split(':');
    if (url_parts[0].indexOf('stun') === 0) {
      // Create iceServer with stun url.
      iceServer = { 'url': url };
    } else if (url_parts[0].indexOf('turn') === 0) {
      // Chrome M28 & above uses below TURN format.
      iceServer = { 'url': url,
                    'credential': password,
                    'username': username };
    }
    return iceServer;
  };

  // The RTCSessionDescription object.
  RTCSessionDescription = function(info) {
    return plugin().ConstructSessionDescription(info.type, info.sdp);
  }

  RTCPeerConnection = function(servers, constraints) {
    var iceServers = servers ? servers.iceServers : null;
    var mandatory = constraints ? constraints.mandatory : null;
    var optional = constraints ? constraints.optional : null;
    return plugin().PeerConnection(iceServers, mandatory, optional);
  }

  if (!MediaStreamTrack)
    MediaStreamTrack = {};
  MediaStreamTrack.getSources = function(callback) {
    plugin().GetSources(callback);
  };

  function getUserMedia_w(constraints, successCallback, failureCallback) {
    plugin().getUserMedia(constraints, successCallback, failureCallback);
  };

  getUserMedia = getUserMedia_w; //plugin().getUserMedia;
  navigator.getUserMedia = getUserMedia;

  // Attach a media stream to an element.
  attachMediaStream = function(element, stream) {
    if (TemPluginActivated)
      plugin().renderStream(stream);
    else {
      if (typeof element.srcObject !== 'undefined') {
        element.srcObject = stream;
      } else if (typeof element.mozSrcObject !== 'undefined') {
        element.mozSrcObject = stream;
      } else if (typeof element.src !== 'undefined') {
        element.src = URL.createObjectURL(stream);
      } else {
        console.log('Error attaching stream to element.');
      }
    }
  };

  reattachMediaStream = function(to, from) {
    to.src = from.src;
  };

  RTCIceCandidate = function(candidate) {
    return plugin().ConstructIceCandidate(candidate.sdpMid, candidate.sdpMLineIndex, candidate.candidate);
  };

} else if (navigator.userAgent.indexOf("Safari")) { ////////////////////////////////////////////////////////////////////////
  console.log("This appears to be Safari");

  TemPluginActivated = plugin() && plugin().valid;

  createIceServer = function(url, username, password) {
    var iceServer = null;
    var url_parts = url.split(':');
    if (url_parts[0].indexOf('stun') === 0) {
      // Create iceServer with stun url.
      iceServer = { 'url': url, 'hasCredentials': false};
    } else if (url_parts[0].indexOf('turn') === 0) {
      iceServer = { 'url': url,
                    'hasCredentials': true,
                    'credential': password,
                    'username': username };
    }
    return iceServer;
  };

  // The RTCSessionDescription object.
  RTCSessionDescription = function(info) {
    return plugin().ConstructSessionDescription(info.type, info.sdp);
  }

  // PEER CONNECTION
  RTCPeerConnection = function(servers, constraints) {
    var iceServers = servers ? servers.iceServers : null;
    var mandatory = (constraints && constraints.mandatory) ? constraints.mandatory : null;
    var optional = (constraints && constraints.optional) ? constraints.optional : null;
    return plugin().PeerConnection(iceServers, mandatory, optional);
  }

  MediaStreamTrack = {};
  MediaStreamTrack.getSources = function(callback) {
    plugin().GetSources(callback);
  };

  function getUserMedia_w(constraints, successCallback, failureCallback) {
    plugin().getUserMedia(constraints, successCallback, failureCallback);
  };

  getUserMedia = getUserMedia_w; //plugin().getUserMedia;
  navigator.getUserMedia = getUserMedia;

  RTCIceCandidate = function(candidate) {
    return plugin().ConstructIceCandidate(candidate.sdpMid, candidate.sdpMLineIndex, candidate.candidate);
  };

  // Attach a media stream to an element.
  attachMediaStream = function(element, stream) {
    if (TemPluginActivated)
      plugin().renderStream(stream);
    else {
      if (typeof element.srcObject !== 'undefined') {
        element.srcObject = stream;
      } else if (typeof element.mozSrcObject !== 'undefined') {
        element.mozSrcObject = stream;
      } else if (typeof element.src !== 'undefined') {
        element.src = URL.createObjectURL(stream);
      } else {
        console.log('Error attaching stream to element.');
      }
    }
  };

} 
else {
  console.log("Browser does not appear to be WebRTC-capable");
}
