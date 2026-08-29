//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'notification_error_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class NotificationErrorResponse {
  /// Returns a new [NotificationErrorResponse] instance.
  NotificationErrorResponse({

     this.error,
  });

  @JsonKey(
    
    name: r'error',
    required: false,
    includeIfNull: false,
  )


  final String? error;





    @override
    bool operator ==(Object other) => identical(this, other) || other is NotificationErrorResponse &&
      other.error == error;

    @override
    int get hashCode =>
        error.hashCode;

  factory NotificationErrorResponse.fromJson(Map<String, dynamic> json) => _$NotificationErrorResponseFromJson(json);

  Map<String, dynamic> toJson() => _$NotificationErrorResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

