//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'notification_unread_count_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class NotificationUnreadCountResponse {
  /// Returns a new [NotificationUnreadCountResponse] instance.
  NotificationUnreadCountResponse({

     this.count,
  });

  @JsonKey(
    
    name: r'count',
    required: false,
    includeIfNull: false,
  )


  final int? count;





    @override
    bool operator ==(Object other) => identical(this, other) || other is NotificationUnreadCountResponse &&
      other.count == count;

    @override
    int get hashCode =>
        count.hashCode;

  factory NotificationUnreadCountResponse.fromJson(Map<String, dynamic> json) => _$NotificationUnreadCountResponseFromJson(json);

  Map<String, dynamic> toJson() => _$NotificationUnreadCountResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

