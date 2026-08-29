//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'notification_message_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class NotificationMessageResponse {
  /// Returns a new [NotificationMessageResponse] instance.
  NotificationMessageResponse({

     this.message,
  });

  @JsonKey(
    
    name: r'message',
    required: false,
    includeIfNull: false,
  )


  final String? message;





    @override
    bool operator ==(Object other) => identical(this, other) || other is NotificationMessageResponse &&
      other.message == message;

    @override
    int get hashCode =>
        message.hashCode;

  factory NotificationMessageResponse.fromJson(Map<String, dynamic> json) => _$NotificationMessageResponseFromJson(json);

  Map<String, dynamic> toJson() => _$NotificationMessageResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

