// We make use of this 'server' variable to provide the address of the
// REST Janus API. By default, in this example we assume that Janus is
// co-located with the web server hosting the HTML pages but listening
// on a different port (8088, the default for HTTP in Janus), which is
// why we make use of the 'window.location.hostname' base address. Since
// Janus can also do HTTPS, and considering we don't really want to make
// use of HTTP for Janus if your demos are served on HTTPS, we also rely
// on the 'window.location.protocol' prefix to build the variable, in
// particular to also change the port used to contact Janus (8088 for
// HTTP and 8089 for HTTPS, if enabled).
// In case you place Janus behind an Apache frontend (as we did on the
// online demos at http://janus.conf.meetecho.com) you can just use a
// relative path for the variable, e.g.:
//
// 		var server = "/janus";
//
// which will take care of this on its own.
//
//
// If you want to use the WebSockets frontend to Janus, instead, you'll
// have to pass a different kind of address, e.g.:
//
// 		var server = "ws://" + window.location.hostname + ":8188";
//
// Of course this assumes that support for WebSockets has been built in
// when compiling the gateway. WebSockets support has not been tested
// as much as the REST API, so handle with care!
//
//
// If you have multiple options available, and want to let the library
// autodetect the best way to contact your gateway (or pool of gateways),
// you can also pass an array of servers, e.g., to provide alternative
// means of access (e.g., try WebSockets first and, if that fails, fall
// back to plain HTTP) or just have failover servers:
//
//		var server = [
//			"ws://" + window.location.hostname + ":8188",
//			"/janus"
//		];
//
// This will tell the library to try connecting to each of the servers
// in the presented order. The first working server will be used for
// the whole session.
//
var server = null;
if(window.location.protocol === 'http:')
	server = "http://" + window.location.hostname + ":8088/janus";
else
	server = "https://" + window.location.hostname + ":8089/janus";

var janus = null;
var mixertest = null;
var opaqueId = "audiobridgetest-"+Janus.randomString(12);

var started = false;
var spinner = null;

var myroom = 1234;	// Demo room
var myusername = null;
var myid = null;
var webrtcUp = false;
var audioenabled = false;


$(document).ready(function() {
	// Initialize the library (all console debuggers enabled)
	Janus.init({debug: "all", callback: function() {
		// Use a button to start the demo
		$('#start').click(function() {
			if(started)
				return;
			started = true;
			$(this).attr('disabled', true).unbind('click');
			// Make sure the browser supports WebRTC
			if(!Janus.isWebrtcSupported()) {
				$.alert({
                    title:" Error!",
                    content: "No WebRTC support... ",
                    useBootstrap: false
                });
				return;
			}
			// Create session
			janus = new Janus(
				{
					server: server,
					success: function() {
						// Attach to Audio Bridge test plugin
						janus.attach(
							{
								plugin: "janus.plugin.audiobridge",
								opaqueId: opaqueId,
								success: function(pluginHandle) {
									$('#details').remove();
									mixertest = pluginHandle;
									Janus.log("Plugin attached! (" + mixertest.getPlugin() + ", id=" + mixertest.getId() + ")");
									// Prepare the username registration
									$('#audiojoin').removeClass('hidden').show();
									$('#registernow').removeClass('hidden').show();
									$('#register').click(registerUsername);
									$('#username').focus();
									$('#start').removeAttr('disabled').html("Stop")
										.click(function() {
											$(this).attr('disabled', true);
											janus.destroy();
										});
								},
								error: function(error) {
									Janus.error("  -- Error attaching plugin...", error);
									$.alert({
                                        title: "Error!",
                                        content: "Error attaching plugin... " + error,
                                        useBootstrap: false
                                    });
								},
								consentDialog: function(on) {
									Janus.debug("Consent dialog should be " + (on ? "on" : "off") + " now");
									if(on) {
										// Darken screen and show hint
										$.blockUI({ 
											message: '<div><img src="' + location.pathname + '/../../chrome/janus/img/up_arrow.png"/></div>',
											css: {
												border: 'none',
												padding: '15px',
												backgroundColor: 'transparent',
												color: '#aaa',
												top: '10px',
												left: (navigator.mozGetUserMedia ? '-100px' : '300px')
											} });
									} else {
										// Restore screen
										$.unblockUI();
									}
								},
								onmessage: function(msg, jsep) {
									Janus.debug(" ::: Got a message :::");
									Janus.debug(JSON.stringify(msg));
									var event = msg["audiobridge"];
									Janus.debug("Event: " + event);
									if(event != undefined && event != null) {
										if(event === "joined") {
											// Successfully joined, negotiate WebRTC now
											myid = msg["id"];
											Janus.log("Successfully joined room " + msg["room"] + " with ID " + myid);
											if(!webrtcUp) {
												webrtcUp = true;
												// Publish our stream
												mixertest.createOffer(
													{
														media: { video: false},	// This is an audio only room
														success: function(jsep) {
															Janus.debug("Got SDP!");
															Janus.debug(jsep);
															var publish = { "request": "configure", "muted": false };
															mixertest.send({"message": publish, "jsep": jsep});
														},
														error: function(error) {
															Janus.error("WebRTC error:", error);
															$.alert({
                                                                title: "Error!",
                                                                content: "WebRTC error... " + JSON.stringify(error),
                                                                useBootstrap: false
                                                            });
														}
													});
											}
											// Any room participant?
											if(msg["participants"] !== undefined && msg["participants"] !== null) {
												var list = msg["participants"];
												Janus.debug("Got a list of participants:");
												Janus.debug(list);
												for(var f in list) {
													var id = list[f]["id"];
													var display = list[f]["display"];
													var muted = list[f]["muted"];
													Janus.debug("  >> [" + id + "] " + display + " (muted=" + muted + ")");
													if($('#rp'+id).length === 0) {
														// Add to the participants list
														$('#list').append('<li id="rp'+id+'" class="list-group-item">'+display+' <i class="fa fa-microphone-slash"></i></li>');
														$('#rp'+id + ' > i').hide();
													}
													if(muted === true || muted === "true")
														$('#rp'+id + ' > i').removeClass('hidden').show();
													else
														$('#rp'+id + ' > i').hide();
												}
											}
										} else if(event === "roomchanged") {
											// The user switched to a different room
											myid = msg["id"];
											Janus.log("Moved to room " + msg["room"] + ", new ID: " + myid);
											// Any room participant?
											$('#list').empty();
											if(msg["participants"] !== undefined && msg["participants"] !== null) {
												var list = msg["participants"];
												Janus.debug("Got a list of participants:");
												Janus.debug(list);
												for(var f in list) {
													var id = list[f]["id"];
													var display = list[f]["display"];
													var muted = list[f]["muted"];
													Janus.debug("  >> [" + id + "] " + display + " (muted=" + muted + ")");
													if($('#rp'+id).length === 0) {
														// Add to the participants list
														$('#list').append('<li id="rp'+id+'" class="list-group-item">'+display+' <i class="fa fa-microphone-slash"></i></li>');
														$('#rp'+id + ' > i').hide();
													}
													if(muted === true || muted === "true")
														$('#rp'+id + ' > i').removeClass('hidden').show();
													else
														$('#rp'+id + ' > i').hide();
												}
											}
										} else if(event === "destroyed") {
											// The room has been destroyed
											Janus.warn("The room has been destroyed!");
											$.alert({
                                                title: "Warning!",
                                                content: "The room has been destroyed",
                                                buttons: {
                                                    OK : function() {
        												window.location.reload();
                                                    }
                                                },
                                                useBootstrap: false
											});
										} else if(event === "event") {
											if(msg["participants"] !== undefined && msg["participants"] !== null) {
												var list = msg["participants"];
												Janus.debug("Got a list of participants:");
												Janus.debug(list);
												for(var f in list) {
													var id = list[f]["id"];
													var display = list[f]["display"];
													var muted = list[f]["muted"];
													Janus.debug("  >> [" + id + "] " + display + " (muted=" + muted + ")");
													if($('#rp'+id).length === 0) {
														// Add to the participants list
														$('#list').append('<li id="rp'+id+'" class="list-group-item">'+display+' <i class="fa fa-microphone-slash"></li>');
														$('#rp'+id + ' > i').hide();
													}
													if(muted === true || muted === "true")
														$('#rp'+id + ' > i').removeClass('hidden').show();
													else
														$('#rp'+id + ' > i').hide();
												}
											} else if(msg["error"] !== undefined && msg["error"] !== null) {
												$.alert({
                                                    title: "Error!",
                                                    content: msg["error"],
                                                    useBootstrap: false
                                                });
												return;
											}
											// Any new feed to attach to?
											if(msg["leaving"] !== undefined && msg["leaving"] !== null) {
												// One of the participants has gone away?
												var leaving = msg["leaving"];
												Janus.log("Participant left: " + leaving + " (we have " + $('#rp'+leaving).length + " elements with ID #rp" +leaving + ")");
												$('#rp'+leaving).remove();
											}
										}
									}
									if(jsep !== undefined && jsep !== null) {
										Janus.debug("Handling SDP as well...");
										Janus.debug(jsep);
										mixertest.handleRemoteJsep({jsep: jsep});
									}
								},
								onlocalstream: function(stream) {
									Janus.debug(" ::: Got a local stream :::");
									Janus.debug(JSON.stringify(stream));
									// We're not going to attach the local audio stream
									$('#audiojoin').hide();
									$('#room').removeClass('hidden').show();
									$('#participant').removeClass('hidden').html(myusername).show();
								},
								onremotestream: function(stream) {
									$('#room').removeClass('hidden').show();
									if($('#roomaudio').length === 0) {
										$('#mixedaudio').append('<audio class="rounded centered" id="roomaudio" width="100%" height="100%" autoplay/>');
									}
									Janus.attachMediaStream($('#roomaudio').get(0), stream);
									// Mute button
									audioenabled = true;
									$('#toggleaudio').click(
										function() {
											audioenabled = !audioenabled;
											if(audioenabled)
												$('#toggleaudio').html("Mute").removeClass("btn-success").addClass("btn-danger");
											else
												$('#toggleaudio').html("Unmute").removeClass("btn-danger").addClass("btn-success");
											mixertest.send({message: { "request": "configure", "muted": !audioenabled }});
										}).removeClass('hidden').show();

								},
								oncleanup: function() {
									webrtcUp = false;
									Janus.log(" ::: Got a cleanup notification :::");
									$('#participant').empty().hide();
									$('#list').empty();
									$('#mixedaudio').empty();
									$('#room').hide();
								}
							});
					},
					error: function(error) {
						Janus.error(error);
						$.alert({
                            title: "Error!",
                            content: error,
                            buttons: {
                                OK: function() {
        							window.location.reload();
                                }
                            },
                            useBootstrap: false
						});
					},
					destroyed: function() {
						window.location.reload();
					}
				});
		});
	}});
});

function checkEnter(field, event) {
	var theCode = event.keyCode ? event.keyCode : event.which ? event.which : event.charCode;
	if(theCode == 13) {
		registerUsername();
		return false;
	} else {
		return true;
	}
}

function registerUsername() {
	if($('#username').length === 0) {
		// Create fields to register
		$('#register').click(registerUsername);
		$('#username').focus();
	} else {
		// Try a registration
		$('#username').attr('disabled', true);
		$('#register').attr('disabled', true).unbind('click');
		var username = $('#username').val();
		if(username === "") {
			$('#you')
				.removeClass().addClass('label label-warning')
				.html("Insert your display name (e.g., pippo)");
			$('#username').removeAttr('disabled');
			$('#register').removeAttr('disabled').click(registerUsername);
			return;
		}
		if(/[^a-zA-Z0-9]/.test(username)) {
			$('#you')
				.removeClass().addClass('label label-warning')
				.html('Input is not alphanumeric');
			$('#username').removeAttr('disabled').val("");
			$('#register').removeAttr('disabled').click(registerUsername);
			return;
		}
		var register = { "request": "join", "room": myroom, "display": username };
		myusername = username;
		mixertest.send({"message": register});
	}
}