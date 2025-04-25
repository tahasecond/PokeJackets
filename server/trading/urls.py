from django.urls import path
from .views import (
    FriendRequestView,
    FriendRequestResponseView,
    FriendListView,
    PendingFriendRequestsView,
    create_trade,
    pending_trades,
    respond_to_trade,
    complete_trade,
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
    path("trades/create/", create_trade, name="create-trade"),
    path("trades/pending/", pending_trades, name="pending-trades"),
    path("trades/<int:trade_id>/respond/", respond_to_trade, name="respond_to_trade"),
    path("trades/complete/", complete_trade, name="complete-trade"),
]
