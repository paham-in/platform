//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'studentclass_message_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class StudentclassMessageResponse {
  /// Returns a new [StudentclassMessageResponse] instance.
  StudentclassMessageResponse({

     this.message,
  });

  @JsonKey(
    
    name: r'message',
    required: false,
    includeIfNull: false,
  )


  final String? message;





    @override
    bool operator ==(Object other) => identical(this, other) || other is StudentclassMessageResponse &&
      other.message == message;

    @override
    int get hashCode =>
        message.hashCode;

  factory StudentclassMessageResponse.fromJson(Map<String, dynamic> json) => _$StudentclassMessageResponseFromJson(json);

  Map<String, dynamic> toJson() => _$StudentclassMessageResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

