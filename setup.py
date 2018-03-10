#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
from setuptools import find_packages, setup

version = '0.4'
readme = os.path.join(os.path.dirname(__file__), 'README.rst')
long_description = open(readme).read()

classifiers = [
    'Environment :: Plugins',
    'Framework :: Trac',
    'Intended Audience :: System Administrators',
    'License :: OSI Approved :: MIT License',
    'Programming Language :: Python',
]

extra = {}

try:
    from trac.dist import get_l10n_js_cmdclass
    cmdclass = get_l10n_js_cmdclass()
    if cmdclass:
        extra['cmdclass'] = cmdclass
except ImportError:
    pass

setup(
    name = 'TracJanusGatewayPlugin',
    version = version,
    author = 't-kenji',
    author_email = 'protect.2501@gmail.com',
    url = 'https://github.com/t-kenji/trac-janus-plugin',
    description = 'Janus Gateway plugin for Trac',
    long_description = long_description,

    license = 'MIT',

    packages = find_packages(exclude=['*.tests*']),
    package_data = {
        'tracjanusgateway': [
            'htdocs/css/*.css',
            'htdocs/js/*.js',
            'htdocs/js/tracjanusgateway/*.js',
            'htdocs/img/*.png',
            'htdocs/fonts/*',
            'htdocs/snd/*',
            'locale/*/LC_MESSAGES/*.mo',
            'templates/*.html',
        ],
    },
    classifiers = classifiers,
    install_requires = [
        'Trac',
    ],
    entry_points = {
        'trac.plugins': [
            'tracjanusgateway = tracjanusgateway',
        ],
    },

    **extra
)
