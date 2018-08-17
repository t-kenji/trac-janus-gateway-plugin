# -*- coding: utf-8 -*-

from trac.core import Interface

class IVideocallListener(Interface):
    """
    Extension point interface for components that should get notified about
    missed-call of video-call.
    """

    def videocall_missedcall(callee, caller, comment):
        """
        """
