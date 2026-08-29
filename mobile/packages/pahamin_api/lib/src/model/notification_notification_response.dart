//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'notification_notification_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class NotificationNotificationResponse {
  /// Returns a new [NotificationNotificationResponse] instance.
  NotificationNotificationResponse({

     this.body,

     this.createdAt,

     this.id,

     this.isRead,

     this.title,

     this.type,

     this.url,
  });

  @JsonKey(
    
    name: r'body',
    required: false,
    includeIfNull: false,
  )


  final String? body;



  @JsonKey(
    
    name: r'created_at',
    required: false,
    includeIfNull: false,
  )


  final String? createdAt;



  @JsonKey(
    
    name: r'id',
    required: false,
    includeIfNull: false,
  )


  final int? id;



  @JsonKey(
    
    name: r'is_read',
    required: false,
    includeIfNull: false,
  )


  final bool? isRead;



  @JsonKey(
    
    name: r'title',
    required: false,
    includeIfNull: false,
  )


  final String? title;



  @JsonKey(
    
    name: r'type',
    required: false,
    includeIfNull: false,
  )


  final String? type;



  @JsonKey(
    
    name: r'url',
    required: false,
    includeIfNull: false,
  )


  final String? url;





    @override
    bool operator ==(Object other) => identical(this, other) || other is NotificationNotificationResponse &&
      other.body == body &&
      other.createdAt == createdAt &&
      other.id == id &&
      other.isRead == isRead &&
      other.title == title &&
      other.type == type &&
      other.url == url;

    @override
    int get hashCode =>
        body.hashCode +
        createdAt.hashCode +
        id.hashCode +
        isRead.hashCode +
        title.hashCode +
        type.hashCode +
        url.hashCode;

  factory NotificationNotificationResponse.fromJson(Map<String, dynamic> json) => _$NotificationNotificationResponseFromJson(json);

  Map<String, dynamic> toJson() => _$NotificationNotificationResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

