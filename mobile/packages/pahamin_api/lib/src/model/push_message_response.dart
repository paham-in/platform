//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'push_message_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class PushMessageResponse {
  /// Returns a new [PushMessageResponse] instance.
  PushMessageResponse({

     this.message,
  });

  @JsonKey(
    
    name: r'message',
    required: false,
    includeIfNull: false,
  )


  final String? message;





    @override
    bool operator ==(Object other) => identical(this, other) || other is PushMessageResponse &&
      other.message == message;

    @override
    int get hashCode =>
        message.hashCode;

  factory PushMessageResponse.fromJson(Map<String, dynamic> json) => _$PushMessageResponseFromJson(json);

  Map<String, dynamic> toJson() => _$PushMessageResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

