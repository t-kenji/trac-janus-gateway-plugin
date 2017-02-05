# -*- coding: utf-8 -*-

import re
from pkg_resources import resource_filename

from genshi.builder import tag
from trac.core import *
from trac.util.text import unicode_quote
from trac.web import IRequestHandler
from trac.web.chrome import (
        INavigationContributor, ITemplateProvider
        add_stylesheet
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
        add_stylesheet(req, 'janus/css/janus.css')
        return 'janus.html', {}, None

    # ITemplateProvider methods

    def get_templates_dirs(self):
        return [ resource_filename(__name__, 'templates') ]

    def get_htdocs_dirs(self):
        yield 'janus', resource_filename(__name__, 'htdocs')
