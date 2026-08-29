//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:pahamin_api/src/model/notification_notification_response.dart';
import 'package:json_annotation/json_annotation.dart';

part 'notification_list_notifications_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class NotificationListNotificationsResponse {
  /// Returns a new [NotificationListNotificationsResponse] instance.
  NotificationListNotificationsResponse({

     this.notifications,

     this.total,
  });

  @JsonKey(
    
    name: r'notifications',
    required: false,
    includeIfNull: false,
  )


  final List<NotificationNotificationResponse>? notifications;



  @JsonKey(
    
    name: r'total',
    required: false,
    includeIfNull: false,
  )


  final int? total;





    @override
    bool operator ==(Object other) => identical(this, other) || other is NotificationListNotificationsResponse &&
      other.notifications == notifications &&
      other.total == total;

    @override
    int get hashCode =>
        notifications.hashCode +
        total.hashCode;

  factory NotificationListNotificationsResponse.fromJson(Map<String, dynamic> json) => _$NotificationListNotificationsResponseFromJson(json);

  Map<String, dynamic> toJson() => _$NotificationListNotificationsResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

