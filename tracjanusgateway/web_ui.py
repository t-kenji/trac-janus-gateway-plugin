# -*- coding: utf-8 -*-

import re
from pkg_resources import resource_filename

from genshi.builder import tag
from trac.core import *
from trac.util.text import unicode_quote
from trac.web import IRequestHandler
from trac.web.chrome import (
        INavigationContributor, ITemplateProvider,
        add_stylesheet, add_script,
)

class JanusGatewayPlugin(Component):
    """
    """

    implements(INavigationContributor, IRequestHandler, ITemplateProvider)

    def __init__(self):
        pass

    # INavigationContributor methods

    def get_active_navigation_item(self, req):
        return 'janus'

    def get_navigation_items(self, req):
        yield ('mainnav', 'janus',
                tag.a('Janus', href = req.href.janus()))

    # IRequestHandler methods
    def match_request(self, req):
        return re.match(r'/janus(?:/.*)?$', req.path_info)

    def process_request(self, req):
        """
        Processing the request.
        """

        data = {}
        template = 'janus.html'
        m = re.match(r'/janus/(?P<plugin>\w+)', req.path_info)
        if (m is not None) and (m.group('plugin')):
            add_stylesheet(req, 'janus/css/jquery-confirm.min.css')
            add_stylesheet(req, 'janus/css/purecss-base-min.css')
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
            add_script(req, 'janus/js/janus.js')

            plugin = m.group('plugin')
            if plugin.startswith('echo'):
                template = 'echo.html'
                add_script(req, 'janus/js/echo.js')
            elif plugin.startswith('videocall'):
                template = 'videocall.html'
                add_script(req, 'janus/js/videocall.js')
            elif plugin.startswith('videoroom'):
                template = 'videoroom.html'
                add_script(req, 'janus/js/videoroom.js')
            elif plugin.startswith('audioroom'):
                template = 'audioroom.html'
                add_script(req, 'janus/js/audiobridge.js')
            elif plugin.startswith('screensharing'):
                template = 'screensharing.html'
                add_script(req, 'janus/js/screensharing.js')
        add_stylesheet(req, 'janus/css/janus.css')

        return (template, data, None)

    # ITemplateProvider methods

    def get_templates_dirs(self):
        return [ resource_filename(__name__, 'templates') ]

    def get_htdocs_dirs(self):
        yield 'janus', resource_filename(__name__, 'htdocs')
