# -*- coding: utf-8 -*-

import re
from pkg_resources import resource_filename

from genshi.builder import tag
from trac.config import ListOption
from trac.core import *
from trac.perm import IPermissionRequestor
from trac.util.text import unicode_quote
from trac.util.translation import domain_functions
from trac.web import IRequestHandler
from trac.web.chrome import (
        INavigationContributor, ITemplateProvider,
        add_ctxtnav, add_stylesheet, add_script,
        add_script_data,
)

_, tag_, N_, ngettext, add_domain = domain_functions('tracjanusgateway',
    '_', 'tag_', 'N_', 'ngettext', 'add_domain')

class JanusGatewayPlugin(Component):
    """
    """

    implements(INavigationContributor, IPermissionRequestor,
               IRequestHandler, ITemplateProvider)

    # Options

    video_rooms = ListOption('janusgateway', 'video_rooms', (1234,),
                             doc = """Room IDs for Janus WebRTC Gateway VideoRooms""")

    audio_rooms = ListOption('janusgateway', 'audio_rooms', (1234,),
                             doc = """Room IDs for Janus WebRTC Gateway AudioRooms""")

    def __init__(self):
        from pkg_resources import resource_filename

        add_domain(self.env.path, resource_filename(__name__, 'locale'))
        pass

    # IPermissionRequestor methods

    def get_permission_actions(self):
        """
        Permisions supported by the plugin.
        """
        return ['JANUS_VIEW']

    # INavigationContributor methods

    def get_active_navigation_item(self, req):
        """
        This method is only called for the `IRequestHandler` processing the
        request.
        """
        return 'janus'

    def get_navigation_items(self, req):
        """
        """
        if 'JANUS_VIEW' in req.perm('janus'):
            yield ('mainnav', 'janus',
                    tag.a('Janus', href = req.href.janus()))

    # IRequestHandler methods

    def match_request(self, req):
        return re.match(r'/janus(?:/.*)?$', req.path_info)

    def process_request(self, req):
        """
        Processing the request.
        """

        req.perm('janus').assert_permission('JANUS_VIEW')

        data = {}
        template = 'janus.html'
        m = re.match(r'/janus/(?P<plugin>\w+)', req.path_info)
        if (m is not None) and (m.group('plugin')):
            add_stylesheet(req, 'janus/css/jquery-confirm.min.css')
            add_stylesheet(req, 'janus/css/purecss-base-min.css')
            add_stylesheet(req, 'janus/css/purecss-forms-min.css')
            add_stylesheet(req, 'janus/css/purecss-grids-min.css')
            add_stylesheet(req, 'janus/css/purecss-grids-responsive-min.css')
            add_stylesheet(req, 'janus/css/purecss-buttons-min.css')
            add_stylesheet(req, 'janus/css/purecss-menus-min.css')
            add_stylesheet(req, 'janus/css/font-awesome.min.css')
            add_script(req, 'janus/js/adapter.min.js')
            add_script(req, 'janus/js/jquery.blockUI.min.js')
            add_script(req, 'janus/js/jquery-confirm.min.js')
            add_script(req, 'janus/js/purecss-menus.js')
            add_script(req, 'janus/js/spin.min.js')
            add_script(req, 'janus/js/compat.js')
            add_script(req, 'janus/js/janus.js')
            self.env.log.info('locale: {}'.format(req.locale))
            if req.locale is not None:
                add_script(req, 'janus/js/tracjanusgateway/{}.js'.format(req.locale))

            if isinstance(req.remote_user, basestring):
                username = req.remote_user
            elif 'name' in req.session:
                username = req.session.get('name', '')
            else:
                username = ''
            data['username'] = username
            data['video_rooms'] = self.video_rooms
            data['audio_rooms'] = self.audio_rooms

            plugin = m.group('plugin')
            if plugin.startswith('echo'):
                add_ctxtnav(req, _('Echo'))
                template = 'echo.html'
                add_script(req, 'janus/js/echo.js')
            else:
                add_ctxtnav(req, _('Echo'), href=req.href.janus('echo'))
            if plugin.startswith('videocall'):
                add_ctxtnav(req, _('VideoCall'))
                template = 'videocall.html'
                add_script(req, 'janus/js/videocall.js')
                add_script_data(req, {'avatar_url': req.href.avatar('')})
            else:
                add_ctxtnav(req, _('VideoCall'), href=req.href.janus('videocall'))
            if plugin.startswith('videoroom'):
                add_ctxtnav(req, _('VideoRoom'))
                template = 'videoroom.html'
                add_script(req, 'janus/js/videoroom.js')
            else:
                add_ctxtnav(req, _('VideoRoom'), href=req.href.janus('videoroom'))
            if plugin.startswith('audioroom'):
                add_ctxtnav(req, _('AudioRoom'))
                template = 'audioroom.html'
                add_script(req, 'janus/js/audiobridge.js')
            else:
                add_ctxtnav(req, _('AudioRoom'), href=req.href.janus('audioroom'))
            if plugin.startswith('screensharing'):
                add_ctxtnav(req, _('ScreenSharing'))
                template = 'screensharing.html'
                add_script(req, 'janus/js/screensharing.js')
            else:
                add_ctxtnav(req, _('ScreenSharing'), href=req.href.janus('screensharing'))
        add_stylesheet(req, 'janus/css/janus.css')

        return (template, data, None)

    # ITemplateProvider methods

    def get_templates_dirs(self):
        return [ resource_filename(__name__, 'templates') ]

    def get_htdocs_dirs(self):
        yield 'janus', resource_filename(__name__, 'htdocs')
