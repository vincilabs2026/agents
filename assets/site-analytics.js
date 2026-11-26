/* Vinci website measurement: no form fields, query strings or booking details. */
(function () {
  'use strict';
  if (window.vinciAnalyticsInstalled) return;
  window.vinciAnalyticsInstalled = true;
  window.dataLayer = window.dataLayer || [];
  function send(name, details, metaName) {
    var payload = Object.assign({event: name, page_path: location.pathname}, details);
    window.dataLayer.push(payload);
    if (typeof window.fbq === 'function') {
      try {
        var metaDetails = Object.assign({}, payload);
        delete metaDetails.event;
        window.fbq('trackSingleCustom', '1208513608507539', metaName, metaDetails);
      } catch (error) { /* Measurement must never block a visitor action. */ }
    }
  }
  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || !target.closest) return;
    var play = target.closest('button.custom-play');
    if (play) {
      var video = play.closest('.video-frame');
      send('demo_play_request', {video_id: video ? video.id : 'demo'}, 'VinciDemoPlayRequest');
      return;
    }
    var link = target.closest('a[href]');
    if (!link) return;
    var destination;
    try { destination = new URL(link.getAttribute('href'), location.href); }
    catch (error) { return; }
    if (destination.origin !== location.origin && destination.hostname !== 'calendly.com') return;
    var isBooking = destination.pathname === '/booking/' ||
      (destination.origin === location.origin && destination.hash === '#calendar') ||
      destination.hostname === 'calendly.com';
    if (!isBooking) return;
    var label = (link.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 100);
    var section = link.closest('header') ? 'header' :
      link.closest('footer') ? 'footer' :
      (link.closest('section[id]') ? link.closest('section[id]').id : 'page');
    send('cta_click', {cta_name: label, cta_section: section,
      target_path: destination.pathname + destination.hash}, 'VinciCTAClick');
  }, true);
  var activeMs = 0;
  var last = Date.now();
  var milestones = [30, 60, 120];
  var next = 0;
  function active() { return document.visibilityState === 'visible' && document.hasFocus(); }
  var wasActive = active();
  function tick() {
    var now = Date.now();
    if (wasActive) activeMs += Math.min(now - last, 2000);
    last = now;
    wasActive = active();
    while (next < milestones.length && activeMs >= milestones[next] * 1000) {
      var seconds = milestones[next++];
      send('engagement_milestone', {active_seconds: seconds}, 'VinciEngagement');
    }
  }
  window.setInterval(tick, 1000);
  document.addEventListener('visibilitychange', tick);
  window.addEventListener('focus', tick);
  window.addEventListener('blur', tick);
  window.addEventListener('pagehide', tick);
})();
