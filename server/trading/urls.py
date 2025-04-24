from django.urls import path
from .views import (
    FriendRequestView,
    FriendRequestResponseView,
    FriendListView,
    PendingFriendRequestsView,
)

urlpatterns = [
    path("friends/request/", FriendRequestView.as_view(), name="friend-request"),
    path(
        "friends/respond/<int:request_id>/",
        FriendRequestResponseView.as_view(),
        name="friend-respond",
    ),
    path("friends/list/", FriendListView.as_view(), name="friend-list"),
    path(
        "friends/pending/", PendingFriendRequestsView.as_view(), name="pending-friends"
    ),
]
