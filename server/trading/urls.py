from django.urls import path
from .views import SendFriendRequestView

urlpatterns = [
    path(
        "api/send-friend-request/",
        SendFriendRequestView.as_view(),
        name="send-friend-request",
    ),
]
