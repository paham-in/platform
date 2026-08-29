//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'questionpackage_message_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class QuestionpackageMessageResponse {
  /// Returns a new [QuestionpackageMessageResponse] instance.
  QuestionpackageMessageResponse({

     this.message,
  });

  @JsonKey(
    
    name: r'message',
    required: false,
    includeIfNull: false,
  )


  final String? message;





    @override
    bool operator ==(Object other) => identical(this, other) || other is QuestionpackageMessageResponse &&
      other.message == message;

    @override
    int get hashCode =>
        message.hashCode;

  factory QuestionpackageMessageResponse.fromJson(Map<String, dynamic> json) => _$QuestionpackageMessageResponseFromJson(json);

  Map<String, dynamic> toJson() => _$QuestionpackageMessageResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

